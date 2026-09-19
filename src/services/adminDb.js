import { db, storage } from '../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Fetch all appointments for the logged-in admin
export const getAdminAppointments = async (businessId) => {
  const q = query(
    collection(db, 'appointments'),
    where('businessId', '==', businessId),
    // orderBy('startTime', 'asc') // Requires an index
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Update Appointment Status
export const updateAppointmentStatus = async (appointmentId, status, fullApp = null) => {
  const docRef = doc(db, 'appointments', appointmentId);
  await updateDoc(docRef, { status });

  if (status === 'Confirmed' && fullApp && fullApp.client?.email) {
    
    // Fetch business details
    const businessDoc = await getDoc(doc(db, 'businesses', fullApp.businessId));
    const business = businessDoc.exists() ? businessDoc.data() : {};
    const businessName = business.businessName || business.name || 'Your Pet Groomer';
    const businessPhone = business.phone || '';
    const businessEmail = business.email || '';

    const apptStartTime = new Date(fullApp.startTime);

    const htmlContent = `
      <div style="font-family: sans-serif; max-w: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #6200ee;">Your Appointment is Confirmed! 🎉</h2>
        <p>Hi ${fullApp.client.ownerName},</p>
        <p>Great news! We have reviewed your request and officially confirmed the grooming appointment for <strong>${fullApp.pet.petName}</strong>.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Date & Time:</strong> ${apptStartTime.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          <p><strong>Service:</strong> ${fullApp.service?.name}</p>
        </div>
        <p>If you have any questions or need to reschedule, please contact us:</p>
        <p>📞 ${businessPhone}<br/>✉️ ${businessEmail}</p>
        <p>Thanks,<br/><strong>${businessName}</strong></p>
      </div>
    `;

    // Send Email via Vercel Serverless Function
    fetch('/api/sendEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: fullApp.client.email,
        subject: `Booking Confirmed! - ${businessName}`,
        html: htmlContent
      })
    }).catch(err => console.error("Failed to trigger email API:", err));
  }
};

// Fetch Clients and their pets
export const getClientsWithPets = async (businessId) => {
  const q = query(collection(db, 'clients'), where('businessId', '==', businessId));
  const snapshot = await getDocs(q);
  
  const clients = [];
  for (const clientDoc of snapshot.docs) {
    const clientData = { id: clientDoc.id, ...clientDoc.data(), pets: [] };
    
    // Fetch pets for this client
    const petsQ = collection(db, `clients/${clientDoc.id}/pets`);
    const petsSnapshot = await getDocs(petsQ);
    clientData.pets = petsSnapshot.docs.map(p => ({ id: p.id, ...p.data() }));
    
    clients.push(clientData);
  }
  return clients;
};

// Upload Rabies Vaccine Record
export const uploadVaccineRecord = async (businessId, clientId, petId, file) => {
  const storageRef = ref(storage, `vaccines/${businessId}/${clientId}/${petId}/${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);
  
  // Update Pet Document
  const petRef = doc(db, `clients/${clientId}/pets`, petId);
  await updateDoc(petRef, { rabiesVaccineUrl: downloadUrl });
  
  return downloadUrl;
};

export const getEnrichedAppointments = async (businessId) => {
  const q = query(
    collection(db, 'appointments'),
    where('businessId', '==', businessId)
  );
  const snapshot = await getDocs(q);
  const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const enriched = await Promise.all(apps.map(async (app) => {
    let clientData = {};
    let petData = {};
    let serviceData = {
      name: app.serviceName || 'Grooming Service',
      price: app.totalPrice ?? app.price ?? 0,
      durationMinutes: app.durationMinutes || 60,
      addons: app.addons || []
    };

    try {
      if (app.clientId) {
        const clientSnap = await getDoc(doc(db, 'clients', app.clientId));
        if (clientSnap.exists()) clientData = clientSnap.data();
      }
      if (app.clientId && app.petId) {
        const petSnap = await getDoc(doc(db, `clients/${app.clientId}/pets`, app.petId));
        if (petSnap.exists()) petData = petSnap.data();
      }
      if (app.serviceId) {
        const serviceSnap = await getDoc(doc(db, 'services', app.serviceId));
        if (serviceSnap.exists()) {
          const dbService = serviceSnap.data();
          serviceData = {
            ...dbService,
            name: app.serviceName || dbService.name,
            price: app.totalPrice ?? app.price ?? dbService.price,
            durationMinutes: app.durationMinutes || dbService.durationMinutes,
            addons: app.addons || []
          };
        }
      }
    } catch(err) {
      console.error("Error enriching appointment:", err);
    }

    return {
      ...app,
      client: clientData,
      pet: petData,
      service: serviceData
    };
  }));

  return enriched;
};
