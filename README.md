## Inspiration
As a pet owner, I’ve experienced the anxiety of not knowing whether my pet’s symptoms were serious or could wait. Searching online often leads to conflicting answers, and vets aren’t always available for quick advice. I realized there’s a need for a fast, intelligent, and reliable system that can help pet owners assess health situations without guessing — and support veterinarians in prioritizing real emergencies. That’s what inspired Pet Health AI.
## What it does
Pet Health AI is a web-based chat assistant that uses RAG (Retrieval-Augmented Generation) to:
- Understand user-described symptoms or concerns in natural language.
- Classify the situation as either an emergency or non-emergency.
- If it's a non-emergency: provide trusted home remedies or actionable steps.
- If it's an emergency: recommend immediate veterinary attention and display nearby vet clinics on a map with directions.
- The platform is also designed to be integrated with vet clinics to streamline triage and intake in the future.
## How we built it
- Frontend: Built with React.js to deliver a smooth, chat-based user interface.
- Backend: Powered by Python (Falsk) with the following components:
- A vector database (Pinecone) to retrieve context-relevant veterinary info.
- A RAG pipeline combining the vector retriever and OpenAI GPT for generating responses.
- A classification module (zero-shot or fine-tuned) to determine emergency severity.
- Mapping: Integrated Google Maps API for location detection and vet clinic display.
## Challenges we ran into
- Data availability: High-quality veterinary datasets are not widely available.
- Emergency detection: It's hard to precisely classify urgency without full clinical input.
- Accuracy vs. liability: Balancing helpfulness with responsibility is tricky in the health domain.
- System integration: Designing a system flexible enough to work with diverse clinic workflows is a challenge for future scaling.
## Accomplishments that we're proud of
- Created a working demo that understands and classifies user queries effectively.
- Successfully integrated a geolocation-based vet locator with real-time mapping.
- Developed a pipeline combining RAG and classification logic tailored for pet health.
- Initiated conversations with veterinarians to validate real-world applications and clinic integration.
## What we learned
- Created a working demo that understands and classifies user queries effectively.
- Successfully integrated a geolocation-based vet locator with real-time mapping.
- Developed a pipeline combining RAG and classification logic tailored for pet health.
- Initiated conversations with veterinarians to validate real-world applications and clinic integration.
## What's next for Pet Health AI
- ✅ Clinic Integration: Connect with veterinary clinics for real-time triage, intake, and appointment scheduling.
- 📱 Mobile App Launch: Enable pet owners to use the platform on-the-go with real-time alerts and updates.
- 🐕 Multi-Species Support: Expand knowledge to include exotic pets, livestock, and more.
- 🗺️ Global Vet Network: Build a database of 24/7 vet clinics with live availability and emergency contacts.
- 📊 Veterinary Dashboard: Offer clinics a dashboard to track trends, common symptoms, and patient histories.
- 🔐 Data Privacy & Compliance: Ensure all personal and health data is secure, encrypted, and privacy-compliant.
- 📡 IoT Device Integration (Future Phase):
     - Integrate with wearables or smart collars to monitor vitals like heart rate, temperature, activity, and GPS.
     - Trigger real-time alerts to owners and clinics if abnormal patterns are detected.
     - Use IoT data to augment the AI triage model with real physiological indicators.
     - Create a connected pet health ecosystem, where AI + sensor data work together for proactive care.