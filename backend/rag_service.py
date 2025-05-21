#logging
import logging

import os
from dotenv import load_dotenv

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

class RAGService:
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
        self.llm = ChatOpenAI(
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
            output_key='answer'
        )
        logger.info("ConversationBufferMemory initialized.")

        # 5. Defining the Prompt Template for the Conversational Chain
        _template = """You are PetHealth AI, a friendly, empathetic, and knowledgeable virtual assistant dedicated to providing pet health information.
Your primary goal is to help pet owners by offering clear, accurate, and easy-to-understand advice based on the provided context from veterinary documents and the ongoing conversation.
Always maintain a supportive and understanding tone, especially if the user expresses concern about their pet.

Follow these guidelines strictly:
1.  Base your answers on the 'Retrieved Context'.
2.  Use the 'Chat History' to understand the flow of the conversation, address follow-up questions, and maintain context.
3.  If the 'Retrieved Context' does not contain sufficient information to answer the 'Human's Question', clearly state that the information is not available in your current knowledge base. For example: "I don't have specific information on that in my current knowledge base." Do NOT invent information or attempt to answer outside the provided context.
4.  If the question is off-topic (not related to pet health), politely decline or gently steer the conversation back. For example: "I'm designed to assist with pet health questions. Do you have any concerns about your pet that I can help with today?"
5.  Provide answers in a conversational and accessible style. Avoid overly technical jargon. If technical terms are necessary, explain them simply.
6.  If the user expresses worry, anxiety, or distress, acknowledge their feelings with empathy before providing information. For example: "I understand this must be worrying for you..." or "I can see why you'd be concerned about that..."
7.  Crucially, do NOT provide specific medical diagnoses or prescribe treatments. Always strongly recommend consulting a qualified veterinarian for diagnosis, treatment decisions, or in emergencies. You can phrase this like: "While I can share some general information based on my resources, it's really important to have a veterinarian examine your pet for an accurate diagnosis and the most appropriate treatment plan." or "For any urgent concerns or if your pet's condition worsens, please contact your vet immediately."

Chat History:
{chat_history}

Retrieved Context:
{context}

Human's Question: {question}

PetHealth AI's Answer:"""
        
        QA_PROMPT = PromptTemplate(
            input_variables=["chat_history", "context", "question"],
            template=_template
        )
        logger.debug("QA_PROMPT template defined for ConversationalRetrievalChain.")

        # 6. Creating a ConversationalRetrievalChain
        logger.debug("Creating ConversationalRetrievalChain...")
        self.qa_chain = ConversationalRetrievalChain.from_llm(
            llm=self.llm,
            retriever=self.retriever,
            memory=self.memory,
            combine_docs_chain_kwargs={"prompt": QA_PROMPT},
            return_source_documents=False, # Set to True for debugging if needed
            output_key='answer',
            # verbose=True # Uncomment for detailed chain logging during development
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

    def generate_response(self, user_query: str, chat_history_from_frontend: list):
        """
        Generate a response using the conversational RAG chain.
        """
        if not self.qa_chain:
            logger.error("RAGService.generate_response: QA Chain is not initialized!")
            return "I'm sorry, but I'm currently unable to process your request due to a setup issue. Please try again later."
        
        logger.info(f"RAGService: Generating response for user query (first 75 chars): '{user_query[:75]}...'")
        logger.debug(f"RAGService: Received chat history (length {len(chat_history_from_frontend)}). Last item (if any): {chat_history_from_frontend[-1:]}")

        langchain_formatted_history = []
        for msg in chat_history_from_frontend:
            if msg.get("sender") == "user":
                langchain_formatted_history.append(HumanMessage(content=msg.get("text")))
            elif msg.get("sender") == "ai":
                langchain_formatted_history.append(AIMessage(content=msg.get("text")))
        
        logger.debug(f"RAGService: Formatted Langchain history for chain (length {len(langchain_formatted_history)}).")
        
        try:
            logger.info("RAGService: Invoking ConversationalRetrievalChain...")
            # The chain's memory will be automatically updated.
            # We pass the history for the current turn's context.
            result = self.qa_chain.invoke({
                "question": user_query,
                "chat_history": langchain_formatted_history # Pass history for context in prompt
            })
            ai_response = result.get("answer", "I'm sorry, I couldn't formulate a response for that.")

            source_documents = result.get("source_documents", [])
            if source_documents:
                logger.debug(f"RAGService: ConversationalRetrievalChain retrieved {len(source_documents)} source documents for query '{user_query[:75]}...':")
                for i, doc in enumerate(source_documents):
                    source_info = doc.metadata.get('source', 'N/A')
                    page_content_snippet = (doc.page_content[:75] + '...') if len(doc.page_content) > 75 else doc.page_content
                    logger.debug(f"  SourceDoc {i+1}: From '{source_info}', Snippet: '{page_content_snippet}'")
            else:
                logger.debug(f"RAGService: No source documents were retrieved by the chain for query '{user_query[:75]}...'.")

            logger.info(f"RAGService: Successfully generated AI response. Length: {len(ai_response)}")
            if logger.isEnabledFor(logging.DEBUG): # Avoid constructing snippet if not logging debug
                 ai_response_snippet_debug = (ai_response[:150] + '...') if len(ai_response) > 150 else ai_response
                 logger.debug(f"RAGService: AI Response Snippet (for debug): '{ai_response_snippet_debug}'")
            
        except Exception as e:
            logger.error(f"RAGService: Error during QA chain invocation for query '{user_query[:75]}...': {e}", exc_info=True)
            # import traceback
            # traceback.print_exc()
            ai_response = "I apologize, but I encountered a technical difficulty. Could you please try rephrasing or asking again in a moment?"

        print(f"AI Response: {ai_response}")
        return ai_response