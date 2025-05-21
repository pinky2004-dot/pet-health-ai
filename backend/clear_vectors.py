# Simple script to delete all vectors

#logging
import logging
from logging.handlers import RotatingFileHandler

import os
from dotenv import load_dotenv
from pinecone import Pinecone

# --- Standalone Script Logging Setup ---
LOG_DIR_SCRIPT_CV = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
if not os.path.exists(LOG_DIR_SCRIPT_CV):
    try:
        os.makedirs(LOG_DIR_SCRIPT_CV)
    except OSError as e:
        print(f"Error creating log directory {LOG_DIR_SCRIPT_CV} for clear_vectors.py: {e}")

LOG_FILE_SCRIPT_CV = os.path.join(LOG_DIR_SCRIPT_CV, 'script_clear_vectors.log')

def setup_clear_vectors_logging():
    logger_instance = logging.getLogger() # Get root logger
    if not logger_instance.hasHandlers(): # Only configure if no handlers exist
        logging.basicConfig(
            level=logging.INFO, 
            format='%(asctime)s [%(levelname)-8s] %(name)-25s %(filename)s:%(lineno)d - %(message)s',
            handlers=[
                RotatingFileHandler(LOG_FILE_SCRIPT_CV, maxBytes=2*1024*1024, backupCount=3, encoding='utf-8'),
                logging.StreamHandler()
            ]
        )
    return logging.getLogger(__name__) # Logger name will be 'clear_vectors'

cv_logger = setup_clear_vectors_logging()

# Load environment variables
load_dotenv()

def clear_pinecone_index():
    cv_logger.info("--- Attempting to clear all vectors from Pinecone index ---")
    # Initialize Pinecone
    pc = Pinecone(
        api_key=os.getenv("PINECONE_API_KEY")
    )
    cv_logger.debug("Pinecone client initialized.")
    
    # Connect to the index
    index_name = os.getenv("PINECONE_INDEX_NAME", "pet-health-rag")
    index = pc.Index(index_name)
    cv_logger.info(f"Successfully connected to Pinecone index: '{index}'.")
    
    cv_logger.info(f"Sending command to delete all vectors from index: '{index}'...")
    # Delete all vectors
    delete_response = index.delete(delete_all=True)
    cv_logger.info(f"Pinecone delete_all operation response for index '{index}': {delete_response}")
    cv_logger.info(f"All vectors should now be cleared from index '{index}'. Note: Deletion might take a short while to reflect in stats.")
    
    cv_logger.info(f"--- Finished attempt to clear vectors from Pinecone index: {index} ---")

if __name__ == "__main__":
    cv_logger.info("clear_vectors.py script started directly.")
    clear_pinecone_index()
    cv_logger.info("clear_vectors.py script finished.")