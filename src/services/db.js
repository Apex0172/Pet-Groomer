import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { startOfDay, endOfDay } from 'date-fns';

// Fetch business details for branding
export const getBusiness = async (businessId) => {
  const docRef = doc(db, 'businesses', businessId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

// Fetch services offered by the business
export const getServices = async (businessId) => {
  const q = query(collection(db, 'services'), where('businessId', '==', businessId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Fetch available time slots for a specific date
export const getAvailableTimeSlots = async (businessId, dateStr, serviceDuration, business) => {
  // 1. Try calling the backend Cloud Function first
  try {
    const functions = getFunctions();
    const getSlotsFn = httpsCallable(functions, 'getAvailableSlots');
    const res = await getSlotsFn({ businessId, date: dateStr, serviceDuration });
    if (res.data?.availableSlots && Array.isArray(res.data.availableSlots)) {
      return res.data.availableSlots.map(s => new Date(s));
    }
  } catch (err) {
    // Cloud function not deployed or network error; fall back to client calculation
    console.warn("Cloud function getAvailableSlots failed or not deployed. Falling back to local slot calculation.", err);
  }

  // Parse 'yyyy-MM-dd' strictly in local time
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  
  const startDay = startOfDay(dateObj);
  const endDay = endOfDay(dateObj);

  let appointments = [];
  try {
    const q = query(
      collection(db, 'appointments'),
      where('businessId', '==', businessId)
    );
    const snapshot = await getDocs(q);
    appointments = snapshot.docs
      .map(doc => doc.data())
      .filter(app => {
        const appStart = new Date(app.startTime);
        return appStart >= startDay && appStart <= endDay && app.status !== 'Rejected' && app.status !== 'Cancelled';
      });
  } catch (err) {
    console.warn("Could not query appointments directly (rules restricted):", err.message);
  }

  const slots = [];
  
  // Parse business hours (e.g. "09:00", "17:00")
  const openTimeParts = (business?.operatingHoursStart || "09:00").split(':').map(Number);
  const closeTimeParts = (business?.operatingHoursEnd || "17:00").split(':').map(Number);

  let current = new Date(startDay);
  current.setHours(openTimeParts[0], openTimeParts[1], 0, 0);
  
  const closeTime = new Date(startDay);
  closeTime.setHours(closeTimeParts[0], closeTimeParts[1], 0, 0);
  
  const now = new Date();

  while (current < closeTime) {
    const slotEnd = new Date(current);
    slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration);
    
    if (slotEnd > closeTime) break;

    // Check for overlap
    const hasOverlap = appointments.some(app => {
      const appStart = new Date(app.startTime);
      const appEnd = new Date(app.endTime);
      return (current < appEnd && slotEnd > appStart);
    });

    // Check if the slot is in the past (adding a 1-hour buffer for same-day bookings)
    const minBookingTime = new Date(now);
    minBookingTime.setHours(minBookingTime.getHours() + 1);

    if (!hasOverlap && current >= minBookingTime) {
      slots.push(new Date(current));
    }
    
    current.setMinutes(current.getMinutes() + 30); // 30 min intervals
  }

  return slots;
};

// Helper to generate a random 32-character hexadecimal token for client self-service
const generateManageToken = () => {
  try {
    const arr = new Uint8Array(24);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
};

// Submit the booking
export const submitBooking = async (businessId, service, selectedTime, client, pet, business) => {
  const functions = getFunctions();
  const bookAppointment = httpsCallable(functions, 'bookAppointment');
  
  try {
    const result = await bookAppointment({
      businessId,
      serviceId: service.id,
      serviceName: service.name,
      totalPrice: service.price,
      totalDuration: service.durationMinutes,
      petSize: service.petSize,
      addons: service.addons || [],
      startTime: selectedTime.toISOString(),
      clientDetails: client,
      petDetails: pet,
      business
    });
    return result.data.appointmentId;
  } catch (error) {
    console.warn("Cloud Function 'bookAppointment' failed or not deployed. Falling back to direct batched database write.", error);
    
    const { writeBatch, doc, collection, serverTimestamp, getDocs, query, where } = await import('firebase/firestore');
    const batch = writeBatch(db);
    
    // 1. Client deduplication: Check if client exists by phone
    let clientId = null;
    let petId = null;

    try {
      const clientQuery = query(
        collection(db, 'clients'),
        where('businessId', '==', businessId),
        where('phone', '==', client.phone)
      );
      const clientSnap = await getDocs(clientQuery);
      if (!clientSnap.empty) {
        clientId = clientSnap.docs[0].id;
        // Check for existing pet by name under client
        const petsSnap = await getDocs(collection(db, `clients/${clientId}/pets`));
        const matchingPet = petsSnap.docs.find(p => p.data().petName?.toLowerCase() === pet.name?.toLowerCase());
        if (matchingPet) {
          petId = matchingPet.id;
        }
      }
    } catch (e) {
      console.warn("Client deduplication check failed:", e);
    }

    // Reference or create Client
    const clientRef = clientId ? doc(db, 'clients', clientId) : doc(collection(db, 'clients'));
    if (!clientId) {
      clientId = clientRef.id;
      batch.set(clientRef, {
        businessId,
        ownerName: client.name,
        phone: client.phone,
        email: client.email || null,
        address: client.address || null,
        createdAt: serverTimestamp()
      });
    } else {
      batch.update(clientRef, {
        ownerName: client.name,
        email: client.email || null,
        ...(client.address ? { address: client.address } : {})
      });
    }
    
    // Reference or create Pet
    const petRef = petId ? doc(db, `clients/${clientId}/pets`, petId) : doc(collection(db, `clients/${clientId}/pets`));
    if (!petId) {
      petId = petRef.id;
      batch.set(petRef, {
        petName: pet.name,
        breed: pet.breed,
        temperament: pet.temperament,
        notes: pet.notes || '',
        size: service.petSize,
        rabiesExpiration: pet.rabiesExpiration || null,
        createdAt: serverTimestamp()
      });
    }
    
    const numAppointments = service.recurringFrequency > 0 ? 6 : 1;
    let firstApptId = null;
    const manageToken = generateManageToken();

    for (let i = 0; i < numAppointments; i++) {
      const apptStartTime = new Date(selectedTime);
      if (i > 0) {
        apptStartTime.setDate(apptStartTime.getDate() + (i * service.recurringFrequency * 7));
      }
      
      const apptEndTime = new Date(apptStartTime);
      apptEndTime.setMinutes(apptEndTime.getMinutes() + service.durationMinutes);
      
      const apptRef = doc(collection(db, 'appointments'));
      if (i === 0) firstApptId = apptRef.id;
      
      const status = business?.autoApproveAppointments ? 'Confirmed' : 'Pending';
      
      // Store full snapshot directly on appointment to preserve price, addons & manageToken
      batch.set(apptRef, {
        businessId,
        clientId: clientId,
        petId: petId,
        serviceId: service.id,
        serviceName: service.name,
        totalPrice: service.price,
        price: service.price,
        durationMinutes: service.durationMinutes,
        petSize: service.petSize,
        addons: service.addons || [],
        startTime: apptStartTime.toISOString(),
        endTime: apptEndTime.toISOString(),
        status: status,
        paymentStatus: business?.requireUpfrontDeposit ? 'Pending Deposit' : 'Unpaid',
        location: service.location || 'mobile',
        manageToken: manageToken,
        createdAt: serverTimestamp(),
        isRecurring: service.recurringFrequency > 0,
        recurringGroupId: firstApptId
      });

      // Send Email via Vercel Serverless Function
      if (i === 0 && client.email) {
        const businessName = business?.businessName || business?.name || 'Your Pet Groomer';
        const businessPhone = business?.phone || '';
        const businessEmail = business?.email || '';
        const manageLink = `${window.location.origin}/manage/${firstApptId}?token=${manageToken}`;
        
        let subject = '';
        let htmlContent = '';

        if (status === 'Confirmed') {
          subject = `Booking Confirmed! - ${businessName}`;
          htmlContent = `
            <div style="font-family: sans-serif; max-w: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #6200ee;">Your Appointment is Confirmed! 🎉</h2>
              <p>Hi ${client.name},</p>
              <p>We are so excited to see <strong>${pet.name}</strong> for their grooming appointment!</p>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Date & Time:</strong> ${apptStartTime.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                <p><strong>Service:</strong> ${service.name}</p>
                <p><strong>Total:</strong> $${service.price.toFixed(2)}</p>
              </div>
              <p style="margin: 20px 0;">
                <a href="${manageLink}" style="background-color: #6200ee; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Manage or Cancel Booking</a>
              </p>
              <p>If you have any questions, contact us:</p>
              <p>📞 ${businessPhone}<br/>✉️ ${businessEmail}</p>
              <p>Thanks,<br/><strong>${businessName}</strong></p>
            </div>
          `;
        } else {
          subject = `Booking Request Received - ${businessName}`;
          htmlContent = `
            <div style="font-family: sans-serif; max-w: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #6200ee;">We got your request! 🐾</h2>
              <p>Hi ${client.name},</p>
              <p>We have received your grooming request for <strong>${pet.name}</strong> on ${apptStartTime.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}.</p>
              <p>Please note that this is currently <strong>Pending Review</strong>. We will review our schedule and confirm shortly!</p>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Estimated Total:</strong> $${service.price.toFixed(2)}</p>
              </div>
              <p style="margin: 20px 0;">
                <a href="${manageLink}" style="background-color: #6200ee; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Booking Status</a>
              </p>
              <p>If you have any questions, contact us:</p>
              <p>📞 ${businessPhone}<br/>✉️ ${businessEmail}</p>
              <p>Thanks,<br/><strong>${businessName}</strong></p>
            </div>
          `;
        }

        fetch('/api/sendEmail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: client.email,
            subject: subject,
            html: htmlContent
          })
        }).catch(err => console.error("Failed to trigger email API:", err));
      }
    }
    
    await batch.commit();
    return firstApptId;
  }
};
