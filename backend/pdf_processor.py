#logging
import logging

import os
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Get a logger for this module
logger = logging.getLogger(__name__) # Logger name will be 'pdf_processor'

class PDFProcessor:
    def __init__(self, chunk_size=1000, chunk_overlap=200):
        """
        Initialize PDF processor with chunk size and overlap parameters
        
        Args:
            chunk_size: Number of characters in each chunk
            chunk_overlap: Number of characters to overlap between chunks
        """
        logger.info(f"Initializing PDFProcessor with chunk_size={chunk_size}, chunk_overlap={chunk_overlap}.")
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len
        )
        logger.debug("RecursiveCharacterTextSplitter initialized for PDFProcessor.")
    
    def extract_text_from_pdf(self, pdf_path):
        """
        Extract text content from a PDF file
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            String containing all text from the PDF
        """
        logger.info(f"Attempting to extract text from PDF: '{pdf_path}'")
        if not os.path.exists(pdf_path):
            logger.error(f"PDF file not found at path: '{pdf_path}'")
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
            
        with open(pdf_path, 'rb') as file:
            pdf_reader = PdfReader(file)
            text = ""
            
            for page in pdf_reader.pages:
                text += page.extract_text()
        
        logger.info(f"Successfully extracted text from '{os.path.basename(pdf_path)}'")
        return text
    
    def process_directory(self, directory_path):
        """
        Process all PDFs in a directory
        
        Args:
            directory_path: Path to directory containing PDF files
            
        Returns:
            List of document chunks with metadata
        """
        logger.info(f"Starting to process PDF directory: '{directory_path}'")
        all_chunks = []

        if not os.path.isdir(directory_path):
            logger.error(f"Provided path is not a directory: '{directory_path}'")
            return all_langchain_documents # Return empty list
        
        for filename in os.listdir(directory_path):
            if filename.endswith('.pdf'):
                file_path = os.path.join(directory_path, filename)
                logger.info(f"Processing file: '{filename}'")
                try:
                    # Extract text from PDF
                    text = self.extract_text_from_pdf(file_path)
                    if not text.strip(): # Check if text is not just whitespace
                        logger.warning(f"No meaningful text content extracted from '{filename}', skipping chunking for this file.")
                        continue
                    
                    # Split into chunks
                    chunks = self.text_splitter.create_documents(
                        [text],
                        metadatas=[{"source": filename}]
                    )
                    
                    # Add to collection
                    all_chunks.extend(chunks)
                    logger.info(f"Successfully processed '{filename}': created {len(chunks)} Langchain Document objects (chunks).")
                    
                except Exception as e:
                    logger.error(f"An unexpected error occurred while processing file '{filename}': {e}", exc_info=True)
        
        return all_chunks
    
    def create_chunks(self, text, metadata=None):
        """
        Create chunks from a text string
        
        Args:
            text: Text content to split into chunks
            metadata: Optional metadata to attach to chunks
            
        Returns:
            List of document chunks
        """
        if metadata is None:
            metadata = {}
            
        return self.text_splitter.create_documents(
            [text],
            metadatas=[metadata]
        )