#logging
import logging
from logging.handlers import RotatingFileHandler

import os
import argparse
from dotenv import load_dotenv
from rag_service import RAGService

# --- Standalone Script Logging Setup ---
# This setup is for when the script is run directly.
# It attempts to configure logging if no handlers are already set on the root logger.
LOG_DIR_IDX_SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
if not os.path.exists(LOG_DIR_IDX_SCRIPT):
    try:
        os.makedirs(LOG_DIR_IDX_SCRIPT)
    except OSError as e:
        print(f"Error creating log directory {LOG_DIR_IDX_SCRIPT} for index_document.py: {e}")

LOG_FILE_IDX_SCRIPT = os.path.join(LOG_DIR_IDX_SCRIPT, 'script_index_document.log')

def setup_standalone_script_logging():
    logger_instance = logging.getLogger() # Get root logger
    # Only configure if no handlers are present (i.e., not run via Flask app which already configures)
    if not logger_instance.hasHandlers(): 
        logging.basicConfig(
            level=logging.INFO, # INFO for standalone script might be sufficient
            format='%(asctime)s [%(levelname)-8s] %(name)-25s %(filename)s:%(lineno)d - %(message)s',
            handlers=[
                RotatingFileHandler(LOG_FILE_IDX_SCRIPT, maxBytes=5*1024*1024, backupCount=3, encoding='utf-8'),
                logging.StreamHandler()
            ]
        )
    # Return a named logger for this script's specific messages
    return logging.getLogger(__name__) # Logger name will be 'index_document'

script_logger = setup_standalone_script_logging()

def main():
    script_logger.info("--- Starting index_document.py script execution ---")
    # Load environment variables
    load_dotenv()
    
    # Parse arguments
    parser = argparse.ArgumentParser(description='Index PDF documents for RAG')
    parser.add_argument('--directory', '-d', type=str, default='../pdfs',
                        help='Directory containing PDF files (default: pdfs)')
    args = parser.parse_args()
    
    pdf_directory = args.directory
    script_logger.debug(f"PDF directory argument received: '{pdf_directory}'")
    
    # Check if directory exists
    if not os.path.exists(pdf_directory):
        script_logger.error(f"Error: PDF source directory not found or is not a directory: '{pdf_directory}'")
        return
    
    # Count PDFs
    pdf_files = [f for f in os.listdir(pdf_directory) if f.lower().endswith('.pdf')]
    if not pdf_files:
        script_logger.warning(f"No PDF files found in the specified directory: '{pdf_directory_abs}'")
        return
    
    script_logger.info(f"Found {len(pdf_files)} PDF files to process in '{pdf_directory}'.")
    
    # Initialize RAG service
    script_logger.info("Initializing RAGService to perform indexing...")
    rag_service = RAGService()
    script_logger.info("RAGService initialized successfully by index_document.py.")
    
    # Index documents
    script_logger.info(f"Calling RAGService.index_documents for directory: '{pdf_directory}'...")
    try:
        num_indexed = rag_service.index_documents(pdf_directory)
        script_logger.info(
            f"RAGService.index_documents completed. Attempted to index {num_indexed} chunks "
            f"from {len(pdf_files)} PDF files in '{pdf_directory_abs}'."
        )
    except Exception as e:
        script_logger.error(f"Error indexing documents: {str(e)}", exc_info=True)
    
    script_logger.info("--- index_document.py script execution finished ---")

if __name__ == "__main__":
    main()