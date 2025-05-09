import os
import argparse
from dotenv import load_dotenv
from rag_service import RAGService

def main():
    # Load environment variables
    load_dotenv()
    
    # Parse arguments
    parser = argparse.ArgumentParser(description='Index PDF documents for RAG')
    parser.add_argument('--directory', '-d', type=str, default='../pdfs',
                        help='Directory containing PDF files (default: pdfs)')
    args = parser.parse_args()
    
    pdf_directory = args.directory
    
    # Check if directory exists
    if not os.path.exists(pdf_directory):
        print(f"Error: Directory not found: {pdf_directory}")
        return
    
    # Count PDFs
    pdf_files = [f for f in os.listdir(pdf_directory) if f.endswith('.pdf')]
    if not pdf_files:
        print(f"No PDF files found in {pdf_directory}")
        return
    
    print(f"Found {len(pdf_files)} PDF files in {pdf_directory}")
    
    # Initialize RAG service
    rag_service = RAGService()
    
    # Index documents
    print("Indexing documents...")
    try:
        num_indexed = rag_service.index_documents(pdf_directory)
        print(f"Successfully indexed {num_indexed} chunks from {len(pdf_files)} PDF files")
    except Exception as e:
        print(f"Error indexing documents: {str(e)}")

if __name__ == "__main__":
    main()