## 🐾 Pet Health AI: Smarter, Faster Veterinary Triage for Every Pet Owner
Across the world, pet owners face a difficult challenge — knowing when something is truly wrong. Is it an emergency or not? Is a vet visit urgent, or can it wait? The difference between hesitation and immediate care can be life or death for a pet — but many hesitate because of cost, access, or uncertainty.

That’s why **Pet Health AI** was created:
A smart, AI-powered veterinary triage assistant that helps users identify pet emergencies in real time — from their phone or computer — and immediately connects them with nearby help.

## How It Works
**AI-Powered Visual Diagnosis**

Users can upload an image (e.g., a dog’s skin rash) and type in a concern like “What is this on my dog’s skin?”
Behind the scenes, the image is processed using a custom-trained SageMaker model deployed to an endpoint. The model was trained on a dataset of annotated veterinary skin conditions. The result: an intelligent, medical-grade explanation and next steps — no guesswork.

**Smart Urgency Detection**

If the user types something more severe — like “my dog is vomiting and shivering” — the app uses Amazon Bedrock for urgency classification. The message is instantly triaged into four levels: urgent, non-urgent, uncertain, or general.
If urgent, the user is automatically redirected to the Emergency Page, where they can:

- View a live map (powered by AWS Location Services)

- See verified nearby vet clinics

- Use a built-in search bar to find clinics based on specialty or hours

**Seamless User Experience**

User authentication is powered by AWS Cognito, ensuring secure sign-up and login flows. Once signed in, users have a clean dashboard experience with real-time, context-aware support. All interactions are backed by OpenAI’s GPT for natural, reliable communication, and Pinecone enables fast, relevant retrieval of veterinary documents and contextual information via a RAG pipeline.

## Why Telecom and 5G Matter
This isn’t just a web app — it’s the foundation for a connected, real-time pet health platform, especially in moments of crisis:

- In the future, Pet Health AI will integrate with wearables and IoT pet collars to monitor vitals like temperature, heart rate, or unusual movements.
These data streams will be analyzed at the edge and prioritized in real time thanks to low-latency 5G connectivity, allowing for immediate triage without the user lifting a finger.

- When every second counts — like identifying internal bleeding or poisoning — uploading a photo or video over 5G ensures ultra-fast emergency recognition and immediate care guidance.

- For pet owners in remote areas or underserved communities, this system can be adapted to run offline-first with edge models, reducing dependence on connectivity and bringing advanced pet care to places where it’s needed most.

## AI for Social Good: Making Pet Healthcare More Equitable
Veterinary care is expensive, often costing hundreds of dollars just for a consultation. Many pet owners — especially in rural areas or low-income communities — simply don’t have access to fast, affordable triage.

Pet Health AI changes that.

- It provides free or low-cost guidance, using AI to reduce unnecessary vet visits.

- It empowers owners to act sooner with confidence.

- And by providing real-time emergency routing and access to clinics, it can save lives while cutting costs.

In regions with less veterinary infrastructure — such as areas served by Safaricom or Fastweb — the app could become a first line of defense for pet health, long before traditional care is reachable.

## What’s Next
Pet Health AI is built to scale. In the future:

- Mobile app versions with camera, voice, and wearable integrations.

- Real-time video analysis of injuries and symptoms.

- IoT collars to alert owners before visible symptoms even appear.

- Offline and edge AI deployments to serve disconnected regions.

## Final Thought
Pet Health AI isn’t just a chatbot or a map.
It’s a lifesaving digital companion, designed with empathy, powered by AI, and built for a world connected by high-speed networks and smarter infrastructure.

Thanks to platforms like AWS, OpenAI, and the vision of the telecom sponsors in this hackathon — this project represents a future where every pet, no matter where they live, can get help fast.