const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");
const { addMinutes, isBefore, isAfter, startOfDay, endOfDay } = require("date-fns");
const { formatInTimeZone } = require("date-fns-tz");

initializeApp();
const db = getFirestore();

exports.bookAppointment = onCall(async (request) => {
  const { 
    businessId, 
    serviceId, 
    serviceName, 
    totalPrice, 
    totalDuration, 
    petSize, 
    addons, 
    startTime, 
    clientDetails, 
    petDetails 
  } = request.data;

  if (!businessId || !serviceId || !startTime || !clientDetails || !petDetails) {
    throw new HttpsError('invalid-argument', 'Missing required fields.');
  }

  const requestedStartTime = new Date(startTime);

  try {
    return await db.runTransaction(async (transaction) => {
      // 1. Fetch Service Details
      const serviceRef = db.collection('services').doc(serviceId);
      const serviceDoc = await transaction.get(serviceRef);
      if (!serviceDoc.exists || serviceDoc.data().businessId !== businessId) {
        throw new HttpsError('not-found', 'Service not found.');
      }
      const serviceData = serviceDoc.data();
      const travelBuffer = 30; // Mobile travel buffer
      const effectiveDuration = (Number(totalDuration) || Number(serviceData.durationMinutes) || 60);
      const durationWithBuffer = effectiveDuration + travelBuffer;
      const requestedEndTime = addMinutes(requestedStartTime, durationWithBuffer);

      // 2. Fetch Business Settings (Working Hours & Timezone) from business document
      const bizRef = db.collection('businesses').doc(businessId);
      const bizDoc = await transaction.get(bizRef);
      let timezone = 'UTC';
      let workingHours = { start: '09:00', end: '17:00' };
      let autoApprove = false;
      let requireDeposit = false;
      
      if (bizDoc.exists) {
        const bData = bizDoc.data();
        if (bData.timezone) timezone = bData.timezone;
        if (bData.operatingHoursStart && bData.operatingHoursEnd) {
          workingHours = { start: bData.operatingHoursStart, end: bData.operatingHoursEnd };
        }
        if (bData.autoApproveAppointments) autoApprove = true;
        if (bData.requireUpfrontDeposit) requireDeposit = true;
        
        // Check blackout dates
        if (bData.blackoutDates && Array.isArray(bData.blackoutDates) && bData.blackoutDates.length > 0) {
          const dateStr = formatInTimeZone(requestedStartTime, timezone, 'yyyy-MM-dd');
          if (bData.blackoutDates.includes(dateStr)) {
            throw new HttpsError('failed-precondition', 'The selected date is blocked by the groomer.');
          }
        }
      }

      // Check working hours logic
      const reqStartStr = formatInTimeZone(requestedStartTime, timezone, 'HH:mm');
      const reqEndStr = formatInTimeZone(requestedEndTime, timezone, 'HH:mm');
      if (reqStartStr < workingHours.start || reqEndStr > workingHours.end) {
        throw new HttpsError('failed-precondition', 'The selected time is outside working hours.');
      }

      // 3. Check for Overlaps (Slot Availability)
      // Index-safe: query by businessId + time range, then filter status in-memory
      const startOfDayUTC = startOfDay(requestedStartTime);
      const endOfDayUTC = endOfDay(requestedStartTime);
      
      const appointmentsQuery = db.collection('appointments')
        .where('businessId', '==', businessId)
        .where('startTime', '>=', startOfDayUTC.toISOString())
        .where('startTime', '<=', endOfDayUTC.toISOString());

      const appointmentsSnapshot = await transaction.get(appointmentsQuery);
      
      let hasOverlap = false;
      appointmentsSnapshot.forEach(doc => {
        const app = doc.data();
        if (app.status === 'Rejected' || app.status === 'Cancelled') return;
        const appStart = new Date(app.startTime);
        const appEnd = new Date(app.endTime);
        
        if (isBefore(requestedStartTime, appEnd) && isAfter(requestedEndTime, appStart)) {
          hasOverlap = true;
        }
      });

      if (hasOverlap) {
        throw new HttpsError('already-exists', 'This time slot is no longer available. Please select another time.');
      }

      // 4. Client deduplication: match existing client by phone within business
      const clientsQuery = db.collection('clients')
        .where('businessId', '==', businessId)
        .where('phone', '==', clientDetails.phone);
      const clientsSnapshot = await transaction.get(clientsQuery);

      let clientRef;
      let petRef;

      if (!clientsSnapshot.empty) {
        clientRef = clientsSnapshot.docs[0].ref;
        transaction.update(clientRef, {
          ownerName: clientDetails.name,
          email: clientDetails.email || '',
          ...(clientDetails.address ? { address: clientDetails.address } : {})
        });

        // Find existing pet by name or create a new pet sub-record
        const petsSnapshot = await transaction.get(clientRef.collection('pets'));
        const existingPetDoc = petsSnapshot.docs.find(p => p.data().petName?.toLowerCase() === petDetails.name?.toLowerCase());
        if (existingPetDoc) {
          petRef = existingPetDoc.ref;
        } else {
          petRef = clientRef.collection('pets').doc();
          transaction.set(petRef, {
            petName: petDetails.name,
            breed: petDetails.breed,
            weight: petDetails.weight || 0,
            temperament: petDetails.temperament,
            notes: petDetails.notes || '',
            size: petSize || 'Medium',
            rabiesExpiration: petDetails.rabiesExpiration || null,
            createdAt: FieldValue.serverTimestamp()
          });
        }
      } else {
        clientRef = db.collection('clients').doc();
        transaction.set(clientRef, {
          businessId,
          ownerName: clientDetails.name,
          phone: clientDetails.phone,
          email: clientDetails.email || '',
          address: clientDetails.address || '',
          createdAt: FieldValue.serverTimestamp()
        });

        petRef = clientRef.collection('pets').doc();
        transaction.set(petRef, {
          petName: petDetails.name,
          breed: petDetails.breed,
          weight: petDetails.weight || 0,
          temperament: petDetails.temperament,
          notes: petDetails.notes || '',
          size: petSize || 'Medium',
          rabiesExpiration: petDetails.rabiesExpiration || null,
          createdAt: FieldValue.serverTimestamp()
        });
      }

      // 5. Generate secure token for self-service portal
      const crypto = require('crypto');
      const manageToken = crypto.randomBytes(32).toString('hex');
      const newAppointmentRef = db.collection('appointments').doc();

      // Write Appointment with full pricing and duration snapshot
      const finalPrice = totalPrice !== undefined ? Number(totalPrice) : Number(serviceData.price);
      transaction.set(newAppointmentRef, {
        businessId,
        clientId: clientRef.id,
        petId: petRef.id,
        serviceId: serviceId,
        serviceName: serviceName || serviceData.name,
        price: finalPrice,
        totalPrice: finalPrice,
        durationMinutes: effectiveDuration,
        petSize: petSize || 'Medium',
        addons: addons || [],
        startTime: requestedStartTime.toISOString(),
        endTime: requestedEndTime.toISOString(),
        status: autoApprove ? 'Confirmed' : 'Pending',
        paymentStatus: requireDeposit ? 'Pending Deposit' : 'Unpaid',
        beforeAfterPhotos: [],
        manageToken: manageToken,
        createdAt: FieldValue.serverTimestamp()
      });

      return { success: true, appointmentId: newAppointmentRef.id, manageToken };
    });
  } catch (error) {
    console.error("Transaction failed: ", error);
    throw new HttpsError('internal', error.message || 'Booking failed.');
  }
});

exports.getAvailableSlots = onCall(async (request) => {
  const { businessId, date, serviceDuration } = request.data;
  if (!businessId || !date || !serviceDuration) {
    throw new HttpsError('invalid-argument', 'Missing required fields.');
  }

  const requestedDate = new Date(date);
  
  // 1. Fetch Business Settings from business document
  const bizDoc = await db.collection('businesses').doc(businessId).get();
  let timezone = 'UTC';
  let workingHours = { start: '09:00', end: '17:00' };
  
  if (bizDoc.exists) {
    const bData = bizDoc.data();
    if (bData.timezone) timezone = bData.timezone;
    if (bData.operatingHoursStart && bData.operatingHoursEnd) {
      workingHours = { start: bData.operatingHoursStart, end: bData.operatingHoursEnd };
    }
    if (bData.blackoutDates && Array.isArray(bData.blackoutDates) && bData.blackoutDates.includes(formatInTimeZone(requestedDate, timezone, 'yyyy-MM-dd'))) {
      return { availableSlots: [] };
    }
  }

  const startOfDayUTC = startOfDay(requestedDate);
  const endOfDayUTC = endOfDay(requestedDate);

  // 2. Fetch appointments (index-safe, filter status in-memory)
  const appointmentsQuery = db.collection('appointments')
    .where('businessId', '==', businessId)
    .where('startTime', '>=', startOfDayUTC.toISOString())
    .where('startTime', '<=', endOfDayUTC.toISOString());

  const snapshot = await appointmentsQuery.get();
  const bookedAppointments = [];
  snapshot.forEach(doc => {
    const app = doc.data();
    if (app.status !== 'Rejected' && app.status !== 'Cancelled') {
      bookedAppointments.push({
        start: new Date(app.startTime),
        end: new Date(app.endTime)
      });
    }
  });

  // 3. Generate slots
  const [startHour, startMin] = workingHours.start.split(':').map(Number);
  const [endHour, endMin] = workingHours.end.split(':').map(Number);
  
  const businessStart = new Date(requestedDate);
  businessStart.setUTCHours(startHour, startMin, 0, 0);
  
  const businessEnd = new Date(requestedDate);
  businessEnd.setUTCHours(endHour, endMin, 0, 0);

  const availableSlots = [];
  let currentSlot = businessStart;
  const travelBuffer = 30;

  while (isBefore(addMinutes(currentSlot, serviceDuration), businessEnd)) {
    const slotEnd = addMinutes(currentSlot, serviceDuration);
    const slotEndWithBuffer = addMinutes(slotEnd, travelBuffer);

    const hasOverlap = bookedAppointments.some(app => {
      return (isBefore(currentSlot, app.end) && isAfter(slotEndWithBuffer, app.start));
    });

    if (!hasOverlap) {
      availableSlots.push(currentSlot.toISOString());
    }

    currentSlot = addMinutes(currentSlot, 30);
  }

  return { availableSlots };
});

exports.cancelAppointment = onCall(async (request) => {
  const { appointmentId, token } = request.data;
  if (!appointmentId || !token) {
    throw new HttpsError('invalid-argument', 'Missing credentials.');
  }

  const appRef = db.collection('appointments').doc(appointmentId);
  const appDoc = await appRef.get();
  
  if (!appDoc.exists) {
    throw new HttpsError('not-found', 'Appointment not found.');
  }

  if (appDoc.data().manageToken !== token) {
    throw new HttpsError('permission-denied', 'Invalid token.');
  }

  // Check if within allowed cancellation window (e.g. 24h before)
  const startTime = new Date(appDoc.data().startTime);
  const now = new Date();
  const hoursUntil = (startTime - now) / (1000 * 60 * 60);

  if (hoursUntil < 24) {
    throw new HttpsError('failed-precondition', 'Cannot cancel within 24 hours of appointment.');
  }

  await appRef.update({ status: 'Cancelled' });
  return { success: true };
});

const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");

// Mock notification services
const sendEmail = async (to, subject, text) => {
  console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Body: ${text}`);
};

const sendSMS = async (to, text) => {
  console.log(`[MOCK SMS] To: ${to} | Body: ${text}`);
};

// 1. Notify on new booking (Pending)
exports.onAppointmentCreated = onDocumentCreated('appointments/{appointmentId}', async (event) => {
  const appointment = event.data.data();
  const appointmentId = event.params.appointmentId;
  
  try {
    // Fetch client details
    const clientDoc = await db.collection('clients').doc(appointment.clientId).get();
    const client = clientDoc.data();
    
    // Fetch business details
    const bizDoc = await db.collection('businesses').doc(appointment.businessId).get();
    const business = bizDoc.data() || { businessName: 'Your Pet Groomer' };

    const emailSubject = `Booking Received: ${business.businessName}`;
    const message = `Hi ${client.ownerName}, we've received your booking request for ${new Date(appointment.startTime).toLocaleString()}. The groomer will review and confirm shortly.`;
    
    if (client.email) await sendEmail(client.email, emailSubject, message);
    if (client.phone) await sendSMS(client.phone, message);

    // Log notification
    await db.collection(`appointments/${appointmentId}/notifications`).add({
      type: 'Booking Received',
      sentAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('Error sending creation notification:', err);
  }
});

// 2. Notify on status change (Confirmed / Rejected)
exports.onAppointmentUpdated = onDocumentUpdated('appointments/{appointmentId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  const appointmentId = event.params.appointmentId;

  // Only trigger if status changed
  if (before.status === after.status) return;

  try {
    const clientDoc = await db.collection('clients').doc(after.clientId).get();
    const client = clientDoc.data();
    
    const bizDoc = await db.collection('businesses').doc(after.businessId).get();
    const business = bizDoc.data() || { businessName: 'Your Pet Groomer' };

    let subject = '';
    let message = '';

    if (after.status === 'Confirmed') {
      subject = `Appointment Confirmed! - ${business.businessName}`;
      message = `Great news ${client.ownerName}! Your appointment on ${new Date(after.startTime).toLocaleString()} is confirmed. Manage your booking here: https://pet-groomer-crm.web.app/manage/${appointmentId}?token=${after.manageToken}`;
    } else if (after.status === 'Rejected') {
      subject = `Appointment Update - ${business.businessName}`;
      message = `Hi ${client.ownerName}, unfortunately we couldn't accommodate your requested time. Please contact us to reschedule.`;
    }

    if (message) {
      if (client.email) await sendEmail(client.email, subject, message);
      if (client.phone) await sendSMS(client.phone, message);

      await db.collection(`appointments/${appointmentId}/notifications`).add({
        type: `Status: ${after.status}`,
        sentAt: FieldValue.serverTimestamp(),
      });
    }
  } catch (err) {
    console.error('Error sending update notification:', err);
  }
});

// --- STRIPE INTEGRATION ---
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');

exports.createStripeCheckoutSession = onCall(async (request) => {
  const { appointmentId, businessId, serviceId } = request.data;
  if (!appointmentId || !businessId || !serviceId) {
    throw new HttpsError('invalid-argument', 'Missing required fields.');
  }

  // 1. Fetch Service and Appointment
  const serviceDoc = await db.collection('services').doc(serviceId).get();
  const service = serviceDoc.data();
  if (!service || !service.depositRequired) {
    return { url: null }; // No deposit required
  }

  // 2. Create Stripe Checkout Session
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${service.serviceName} Deposit`,
            description: `Deposit for booking appointment`,
          },
          unit_amount: service.depositAmount * 100, // Amount in cents
        },
        quantity: 1,
      }],
      success_url: `https://pet-groomer-crm.web.app/manage/${appointmentId}?token=YOUR_SECURE_TOKEN&payment=success`,
      cancel_url: `https://pet-groomer-crm.web.app/book/${businessId}?cancel=true`,
      client_reference_id: appointmentId, // Tie payment to appointment
      metadata: {
        appointmentId,
        businessId
      }
    });

    // Update appointment to expect payment
    await db.collection('appointments').doc(appointmentId).update({
      paymentStatus: 'pending',
      stripeSessionId: session.id
    });

    return { url: session.url };
  } catch (error) {
    console.error('Stripe error:', error);
    throw new HttpsError('internal', 'Unable to create checkout session.');
  }
});

const { onRequest } = require("firebase-functions/v2/https");

exports.stripeWebhook = onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock';

  let event;
  try {
    // In a real environment, you must use raw body to construct event
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const appointmentId = session.client_reference_id;

    if (appointmentId) {
      await db.collection('appointments').doc(appointmentId).update({
        paymentStatus: 'paid',
        status: 'Pending' // Keep pending until groomer confirms, but mark as paid
      });
      
      // We could optionally send a "Payment Received" notification here
      await db.collection(`appointments/${appointmentId}/notifications`).add({
        type: 'Deposit Paid',
        sentAt: FieldValue.serverTimestamp(),
      });
    }
  }

  res.json({received: true});
});

// 3. Daily cron job for review requests
const { onSchedule } = require("firebase-functions/v2/scheduler");

exports.sendReviewRequests = onSchedule("0 9 * * *", async (event) => {
  console.log("Running daily review request job...");
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const startOfYesterday = startOfDay(yesterday).toISOString();
  const endOfYesterday = endOfDay(yesterday).toISOString();

  try {
    const snapshot = await db.collection('appointments')
      .where('status', '==', 'Confirmed') // In a real app, status might be 'Completed'
      .where('endTime', '>=', startOfYesterday)
      .where('endTime', '<=', endOfYesterday)
      .get();

    for (const doc of snapshot.docs) {
      const app = doc.data();
      const clientDoc = await db.collection('clients').doc(app.clientId).get();
      const client = clientDoc.data();
      
      const bizDoc = await db.collection('businesses').doc(app.businessId).get();
      const biz = bizDoc.data();
      
      if (client.email && biz.googleReviewLink) {
        await sendEmail(
          client.email,
          `How did we do? - ${biz.businessName}`,
          `Hi ${client.ownerName}, we hope your pet loved their groom! If you have a minute, please leave us a review: ${biz.googleReviewLink}`
        );
      }
    }
  } catch (err) {
    console.error("Error sending review requests:", err);
  }
});

// 4. Calendar Sync (ICS Feed)
exports.exportCalendarIcs = onRequest(async (req, res) => {
  const businessId = req.query.businessId;
  const token = req.query.token; // Simple security token to prevent public guessing

  if (!businessId || !token) {
    return res.status(400).send("Missing parameters");
  }

  // Validate business and token (mocked validation for demo)
  const bizDoc = await db.collection('businesses').doc(businessId).get();
  if (!bizDoc.exists || bizDoc.data().calendarToken !== token) {
    return res.status(403).send("Unauthorized");
  }

  // Fetch upcoming appointments
  const now = new Date();
  const snapshot = await db.collection('appointments')
    .where('businessId', '==', businessId)
    .where('status', 'in', ['Pending', 'Confirmed'])
    .where('startTime', '>=', now.toISOString())
    .get();

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pet Groomer CRM//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  for (const docSnapshot of snapshot.docs) {
    const app = docSnapshot.data();
    
    // Fetch client and pet details for the calendar event
    const clientDoc = await db.collection('clients').doc(app.clientId).get();
    const client = clientDoc.data();
    const petDoc = await db.collection(`clients/${app.clientId}/pets`).doc(app.petId).get();
    const pet = petDoc.data();
    
    const startObj = new Date(app.startTime);
    const endObj = new Date(app.endTime);
    
    const dtstart = startObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dtend = endObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${docSnapshot.id}@petgroomercrm.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:Grooming: ${pet?.petName} (${client?.ownerName})`,
      `DESCRIPTION:Phone: ${client?.phone}\\nTemperament: ${pet?.temperament}\\nNotes: ${pet?.notes}`,
      `STATUS:${app.status === 'Confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
      'END:VEVENT'
    );
  }

  icsContent.push('END:VCALENDAR');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="groomer_calendar_${businessId}.ics"`);
  res.status(200).send(icsContent.join('\r\n'));
});
