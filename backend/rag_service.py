#logging
import logging

import os
from dotenv import load_dotenv
import boto3
import json
import ast
import base64

# Langchain components
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
from langchain.prompts import PromptTemplate
from langchain_core.messages import HumanMessage, AIMessage

# existing helper classes for indexing
from embedding_manager import EmbeddingManager # This will use text-embedding-3-large
from pdf_processor import PDFProcessor

# Get a logger for this module. It will inherit configuration from app.py's basicConfig.
logger = logging.getLogger(__name__) # Logger name will be 'rag_service'

# Load environment variables
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

# Consistent Embedding Model - matches Pinecone index and EmbeddingManager
# Pinecone index has 3072 dimensions, matching text-embedding-3-large.
EMBEDDING_MODEL_NAME = "text-embedding-3-large"
LLM_MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-4.1")

AWS_REGION = os.getenv("REGION_NAME", "us-east-1")
BEDROCK_CLASSIFICATION_MODEL_ID = os.getenv("BEDROCK_CLASSIFICATION_MODEL_ID")
SAGEMAKER_SKIN_ANALYSIS_ENDPOINT_NAME = os.getenv("SAGEMAKER_SKIN_ENDPOINT_NAME")
SAGEMAKER_SKIN_ENDPOINT_CONTENT_TYPE = os.getenv("SAGEMAKER_SKIN_CONTENT_TYPE", "application/x-image") 
SAGEMAKER_SKIN_ENDPOINT_ACCEPT_TYPE = "application/json"

class RAGService:
    _SADEMAKER_MODEL_CLASS_NAMES = [
        "dog_demodicosis", 
        "dog_dermatitis", 
        "dog_fungal_infections",
        "dog_healthy",
        "dog_hypersensitivity",
        "dog_ringworm"
    ]

    def __init__(self):
        """
        Initialize the RAG service with Langchain components for conversational RAG.
        Ensures embedding model consistency with my Pinecone setup (text-embedding-3-large, 3072 dims).
        """
        logger.info(f"Initializing RAGService with LLM: '{LLM_MODEL_NAME}' and Embeddings: '{EMBEDDING_MODEL_NAME}' (3072 dimensions).")
        if not all([OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX_NAME]): # PINECONE_ENVIRONMENT might be optional for serverless
            logger.error("Missing one or more critical environment variables for RAGService initialization.")
            raise ValueError(
                "Missing one or more critical environment variables: "
                "OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX_NAME"
            )
        
        try:
            self.bedrock_runtime_client = boto3.client(service_name='bedrock-runtime', region_name=AWS_REGION)
            logger.info(f"AWS Bedrock runtime client initialized for region '{AWS_REGION}'.")
                
            if SAGEMAKER_SKIN_ANALYSIS_ENDPOINT_NAME:
                self.sagemaker_runtime_client = boto3.client(service_name='sagemaker-runtime', region_name=AWS_REGION)
                logger.info(f"AWS SageMaker runtime client initialized for region '{AWS_REGION}'.")
            else:
                self.sagemaker_runtime_client = None
                logger.warning("SAGEMAKER_SKIN_ENDPOINT_NAME not set. Skin image analysis will be disabled.")
        except Exception as e:
            logger.error(f"CRITICAL: Failed to initialize AWS SDK clients: {e}", exc_info=True)
            raise

        # 1. Initialize Embeddings model (for retrieval by Langchain)
        # This MUST be the SAME model used for indexing (text-embedding-3-large).
        logger.debug(f"Attempting to initialize OpenAI Embeddings with model: '{EMBEDDING_MODEL_NAME}'...")
        self.embeddings = OpenAIEmbeddings(
            openai_api_key=OPENAI_API_KEY,
            model=EMBEDDING_MODEL_NAME
        )
        logger.info(f"OpenAI Embeddings for Langchain retriever initialized successfully with '{EMBEDDING_MODEL_NAME}'.")

        # 2. Initialize LLM
        logger.debug(f"Attempting to initialize ChatOpenAI LLM with model: '{LLM_MODEL_NAME}'...")
        self.llm_rag = ChatOpenAI(
            openai_api_key=OPENAI_API_KEY,
            model_name=LLM_MODEL_NAME,
            temperature=0.6 # Good balance for informative yet slightly varied pet health advice
        )
        logger.info(f"ChatOpenAI LLM initialized successfully with '{LLM_MODEL_NAME}'.")

        # 3. Initialize Pinecone Vector Store as Retriever
        # Connects to my existing Pinecone index populated with text-embedding-3-large embeddings.
        try:
            logger.info(f"Attempting to connect to Pinecone index: '{PINECONE_INDEX_NAME}'.")
            # For pinecone-client v3+, environment might be implicitly handled or part of host.
            # Langchain's PineconeVectorStore should handle this.
            self.vector_store = PineconeVectorStore.from_existing_index(
                index_name=PINECONE_INDEX_NAME,
                embedding=self.embeddings,
                # pinecone_api_key=PINECONE_API_KEY, # Usually picked from env
                # pinecone_environment=PINECONE_ENVIRONMENT, # If required by your setup/client version
            )
            self.retriever = self.vector_store.as_retriever(
                search_type="similarity",
                search_kwargs={'k': 5} # Number of documents to retrieve for context
            )
            logger.info("Pinecone vector store and retriever initialized successfully.")
        except Exception as e:
            # print(f"Error initializing Pinecone vector store for Langchain: {e}")
            # print("Ensure Pinecone index exists and is accessible.")
            logger.error(f"Failed to initialize Pinecone vector store for Langchain using index '{PINECONE_INDEX_NAME}': {e}", exc_info=True)
            raise

        # 4. Initialize Conversation Memory
        logger.debug("Initializing ConversationBufferMemory...")
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
            output_key='answer',
            input_key='question' # This tells the memory what to consider as the "Human" input
        )
        logger.info("ConversationBufferMemory initialized.")

        # 5. Defining the Prompt Template for the Conversational Chain
        _rag_template = """You are PetHealth AI, a friendly, empathetic, and knowledgeable virtual assistant.
The user's query has been preliminarily assessed as NON-URGENT.
Your role is to provide helpful at-home advice and information based on the 'Retrieved Context' from veterinary documents and the 'Chat History'.
The 'Human's Question' may contain preliminary findings from an AI image analysis (SageMaker); you MUST incorporate these findings thoughtfully into your response if the user's question is about a skin condition or the image.
If the context from the documents doesn't fully answer the user's question, state that and suggest general care or monitoring based on the provided information.
Always remind the user to consult a veterinarian if symptoms worsen, if they are unsure, or for a definitive diagnosis.

Retrieved Context from documents:
{context}

Chat History:
{chat_history}

Human's Question:
{question}

PetHealth AI's Non-Urgent Advice (synthesizing all available information):"""
        
        RAG_PROMPT = PromptTemplate(
            input_variables=["chat_history", "context", "question"], 
            template=_rag_template
        )
        logger.debug("QA_PROMPT template defined for ConversationalRetrievalChain.")

        # 6. Creating a ConversationalRetrievalChain
        logger.debug("Creating ConversationalRetrievalChain...")
        self.qa_chain_rag = ConversationalRetrievalChain.from_llm(
            llm=self.llm_rag, retriever=self.retriever, memory=self.memory,
            combine_docs_chain_kwargs={"prompt": RAG_PROMPT},
            return_source_documents=True, output_key='answer'
        )
        logger.info("ConversationalRetrievalChain created successfully.")
        logger.info("RAGService core components initialization complete.")

        # For indexing, these are the existing components.
        # EmbeddingManager should already be using "text-embedding-3-large" and 3072 dimensions.
        logger.debug("Initializing PDFProcessor and EmbeddingManager for indexing tasks...")
        self.pdf_processor = PDFProcessor()
        self.embedding_manager = EmbeddingManager() # This should pick up text-embedding-3-large from its own __init__
        logger.info(f"PDFProcessor and EmbeddingManager instances created for indexing.")
        if self.embedding_manager.embedding_model != EMBEDDING_MODEL_NAME or \
           self.embedding_manager.pinecone_dimension != 3072:
            logger.warning(f"WARNING: EmbeddingManager model/dimension mismatch! Manager uses {self.embedding_manager.embedding_model} ({self.embedding_manager.pinecone_dimension} dims), RAGService expects {EMBEDDING_MODEL_NAME} (3072 dims). Ensure consistency.")
        else:
            logger.info("PDFProcessor and EmbeddingManager confirmed for indexing (using {self.embedding_manager.embedding_model}).")


    def index_documents(self, pdf_directory):
        """
        Process PDFs and index them in Pinecone using PDFProcessor and EmbeddingManager.
        This assumes EmbeddingManager is correctly configured for text-embedding-3-large.
        """
        logger.info(f"RAGService: Starting document indexing from directory: '{pdf_directory}'")
        try:
            langchain_documents = self.pdf_processor.process_directory(pdf_directory)
            
            if not langchain_documents:
                logger.warning(f"RAGService: PDFProcessor returned no documents from '{pdf_directory}'.")
                return 0
            
            logger.info(f"RAGService: PDFProcessor processed {len(langchain_documents)} Langchain document objects.")
            logger.info("RAGService: Calling EmbeddingManager to upsert documents...")
            num_indexed = self.embedding_manager.upsert_documents(langchain_documents)
            logger.info(f"RAGService: EmbeddingManager successfully processed {num_indexed} chunks for upsertion.")
            return num_indexed
        except Exception as e:
            logger.error(f"RAGService: Error during document indexing for directory '{pdf_directory}': {e}", exc_info=True)
            # import traceback
            # traceback.print_exc()
            raise
    
    def classify_urgency_with_bedrock(self, user_query: str, chat_history: list) -> str:
        """
        FIXED V2: This version adds a 'GENERAL_CONVERSATION' category to better handle
        non-medical questions and prevent incorrect urgency classifications.
        """
        logger.info(f"Classifying query type/urgency with Bedrock for query: '{user_query[:100]}...'")

        # This correctly uses only the user's history to avoid context pollution
        user_history_messages = [f"User: {msg.get('text')}" for msg in chat_history[-5:] if msg.get('sender') == 'user']
        history_str = "\n".join(user_history_messages)

        # V2 PROMPT: Added GENERAL_CONVERSATION as an option and clarified instructions.
        system_prompt = """You are an AI assistant that classifies pet-related user queries into one of four categories. Respond with only one of these exact phrases: URGENT, NON_URGENT, UNCERTAIN, or GENERAL_CONVERSATION.
    - URGENT: The user describes a life-threatening situation, severe distress, or a serious medical condition requiring immediate attention (e.g., "can't breathe," "ate poison," "heavy bleeding").
    - NON_URGENT: The user asks about common, mild ailments, general health questions, or describes non-critical symptoms (e.g., "my dog is itching," "what should I feed my cat?").
    - GENERAL_CONVERSATION: The user's query is conversational and not a health question (e.g., "hello," "thank you," "I have two dogs").
    - UNCERTAIN: The query is too vague to classify, but seems like it might be about a health concern.
    """
        
        user_message_content = f"Please classify the user's latest query based on their conversation history.\n\nRecent User Queries:\n<chat_history>\n{history_str or 'N/A'}\n</chat_history>\n\nUser's Latest Query: \"{user_query}\"\n\nClassification:"
        
        messages = [{"role": "user", "content": [{"type": "text", "text": user_message_content}]}]
        body = json.dumps({"anthropic_version": "bedrock-2023-05-31", "max_tokens": 20, "temperature": 0.0, "system": system_prompt, "messages": messages})
        
        try:
            response = self.bedrock_runtime_client.invoke_model(body=body, modelId=BEDROCK_CLASSIFICATION_MODEL_ID, accept='application/json', contentType='application/json')
            response_body = json.loads(response.get('body').read())
            raw_text = response_body.get("content", [{}])[0].get("text", "").strip().upper().replace("_", " ")

            # Check for the new category first
            if "GENERAL CONVERSATION" in raw_text:
                classification = "GENERAL_CONVERSATION"
            elif "URGENT" in raw_text:
                classification = "URGENT"
            elif "NON URGENT" in raw_text:
                classification = "NON_URGENT"
            else:
                classification = "UNCERTAIN" # Default fallback
            
            logger.info(f"Bedrock query classification result: '{classification}'")
            return classification
        except Exception as e:
            logger.error(f"Error during Bedrock urgency classification: {e}", exc_info=True)
            return "UNCERTAIN"
    
    def analyze_skin_image_with_sagemaker(self, image_bytes: bytes) -> dict:
        if not self.sagemaker_runtime_client:
            return {"analysis_summary": "Image analysis feature not configured."}
        logger.info(f"Invoking SageMaker endpoint '{SAGEMAKER_SKIN_ANALYSIS_ENDPOINT_NAME}' with image of size {len(image_bytes)} bytes.")
        try:
            response = self.sagemaker_runtime_client.invoke_endpoint(
                EndpointName=SAGEMAKER_SKIN_ANALYSIS_ENDPOINT_NAME,
                ContentType=SAGEMAKER_SKIN_ENDPOINT_CONTENT_TYPE,
                Body=image_bytes
            )
            response_body_str = response['Body'].read().decode('utf-8')
            logger.debug(f"SageMaker raw response string: {response_body_str}")
                
            probabilities = ast.literal_eval(response_body_str)
                
            if isinstance(probabilities, list) and len(probabilities) == len(self._SADEMAKER_MODEL_CLASS_NAMES):
                max_score = max(probabilities)
                max_index = probabilities.index(max_score)
                predicted_label = self._SADEMAKER_MODEL_CLASS_NAMES[max_index]
                analysis_summary = f"Preliminary image analysis suggests the condition appears most similar to '{predicted_label}' (with a {max_score:.1%} confidence score). This is not a definitive diagnosis and a veterinarian must be consulted for confirmation."
                logger.info(f"SageMaker prediction: '{predicted_label}' with score {max_score:.4f}")
            else:
                analysis_summary = "Image analysis results received in an unexpected format."
                logger.warning(f"Parsed SageMaker output was not a list of {len(self._SADEMAKER_MODEL_CLASS_NAMES)} probabilities: {probabilities}")

            return {"analysis_summary": analysis_summary, "raw_output": probabilities}
        except Exception as e:
            logger.error(f"Error invoking or parsing SageMaker endpoint response: {e}", exc_info=True)
            return {"analysis_summary": "Could not perform skin image analysis due to a technical issue."}

    def generate_response(self, user_query: str, chat_history_from_frontend: list, image_data_base64: str = None) -> dict:
        """
        FIXED V2: This version handles the new 'GENERAL_CONVERSATION' category to provide
        a more natural, friendly response to non-medical queries. It also ensures the
        conversation memory is cleared for each request.
        """
        classification = self.classify_urgency_with_bedrock(user_query, chat_history_from_frontend)
        
        sagemaker_analysis_summary = "No image was submitted for analysis."
        sagemaker_raw_output = None

        if image_data_base64:
            sagemaker_result_dict = self.analyze_skin_image_with_sagemaker(base64.b64decode(image_data_base64))
            sagemaker_analysis_summary = sagemaker_result_dict.get("analysis_summary", "Image analysis failed.")
            sagemaker_raw_output = sagemaker_result_dict.get("raw_output")
        
        additional_data = {"sagemaker_analysis": {"summary": sagemaker_analysis_summary, "raw": sagemaker_raw_output}}
        response_message = ""
        # The 'urgency' key in the response will now hold one of the four categories
        urgency_for_frontend = classification

        if classification == "URGENT":
            response_message = (
                f"**IMPORTANT: Based on your description, this situation sounds potentially serious and may require "
                f"IMMEDIATE veterinary attention. Please contact your local vet or an emergency animal hospital right away.**\n\n"
                f"AI Skin Image Analysis (if image provided): {sagemaker_analysis_summary}\n\n"
                "We can help you find the nearest emergency vet. Please remember, our AI tools provide preliminary insights and are NOT a substitute for professional veterinary examination and diagnosis."
            )
            additional_data.update({"action_required": "IMMEDIATE_VET_CONSULTATION", "suggest_find_vet": True, "navigate_to_emergency_page": True})
        
        else: # Handles NON_URGENT, UNCERTAIN, and GENERAL_CONVERSATION
            try:
                question_for_rag = user_query
                if image_data_base64 and sagemaker_analysis_summary.find("No image") == -1 and sagemaker_analysis_summary.find("not available") == -1:
                    question_for_rag = (
                        f"A skin image was analyzed by an AI, which provided the following preliminary findings: '{sagemaker_analysis_summary}'. "
                        f"Based on this finding AND the user's text query below, please provide advice.\n\n"
                        f"User's Text Query: {user_query}"
                    )

                # Clear memory from the previous request to ensure the chain is stateless.
                self.memory.clear()
                langchain_formatted_history = [HumanMessage(content=msg['text']) if msg['sender'] == 'user' else AIMessage(content=msg['text']) for msg in chat_history_from_frontend]
                self.memory.chat_memory.add_messages(langchain_formatted_history)

                result = self.qa_chain_rag.invoke({
                    "question": question_for_rag
                })
                
                rag_answer = result.get("answer", "I'm not quite sure how to respond to that, but I'm here to help with your pet's health questions.")
                
                # Tailor the response prefix based on the classification.
                if classification == "UNCERTAIN":
                    # Only show the warning for UNCERTAIN health-related queries.
                    response_message = f"I'm not entirely sure about the urgency of this situation. Here is some information that may be helpful, but it's always safest to consult a vet if you are concerned:\n\n{rag_answer}"
                else: # NON_URGENT and GENERAL_CONVERSATION get a direct, friendly answer.
                    response_message = rag_answer
                
                additional_data["action_required"] = "MONITOR_AND_CONSIDER_VET_IF_NEEDED"

            except Exception as e:
                logger.error(f"RAGService: Error during RAG chain invocation: {e}", exc_info=True)
                response_message = f"I'm having trouble retrieving detailed information from my knowledge base right now. Image analysis: {sagemaker_analysis_summary}. Please monitor your pet and contact your vet if things don't improve."
                urgency_for_frontend = "UNCERTAIN" 
                additional_data.update({"action_required": "MONITOR_AND_CONSIDER_VET_IF_NEEDED", "error_retrieving_details": True})
                
        # Return a clean response object for the frontend to handle.
        return {"urgency": urgency_for_frontend, "response": response_message, "data": additional_data}