from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_compress import Compress
import os
from dotenv import load_dotenv
from rag_service import RAGService

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
Compress(app) # Enable gzip compression

# Initialize RAG service
rag_service = RAGService()

@app.route('/api/index', methods=['POST'])
def index_documents():
    """
    Endpoint to index PDF documents
    """
    data = request.json
    pdf_directory = data.get('directory', 'pdfs')
    
    if not os.path.exists(pdf_directory):
        return jsonify({"error": f"Directory not found: {pdf_directory}"}), 404
    
    try:
        num_indexed = rag_service.index_documents(pdf_directory)
        return jsonify({"success": True, "indexed": num_indexed})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Endpoint to handle chat messages and provide AI responses using RAG
    """
    data = request.json
    user_message = data.get('message', '')
    
    if not user_message:
        return jsonify({"error": "Empty message"}), 400
    
    try:
        response = rag_service.generate_response(user_message)
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)