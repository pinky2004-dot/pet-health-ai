#logging
import logging
from logging.handlers import RotatingFileHandler

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_compress import Compress
import os
from dotenv import load_dotenv
from rag_service import RAGService
from flask_awscognito import AWSCognitoAuthentication

# Load environment variables
load_dotenv()

# --- Central Logging Setup ---
# Configured once, as early as possible in the application's lifecycle.
LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
if not os.path.exists(LOG_DIR):
    try:
        os.makedirs(LOG_DIR)
    except OSError as e:
        # Fallback to print if logging isn't even set up for this critical error
        print(f"Error creating log directory {LOG_DIR}: {e}") 
        # Potentially exit or use a default log path if directory creation fails

LOG_FILE_APP = os.path.join(LOG_DIR, 'pethealth_main_app.log') # Specific name for app logs

# Configure root logger. `force=True` will remove any existing handlers
# and reconfigure, which is useful if other modules (like Flask) try to set up basicConfig.
logging.basicConfig(
    level=logging.DEBUG, # Capture DEBUG level and above from all loggers. Set to INFO in production.
    format='%(asctime)s [%(levelname)-8s] %(name)-30s %(filename)s:%(lineno)d - %(message)s',
    handlers=[
        RotatingFileHandler(LOG_FILE_APP, maxBytes=10*1024*1024, backupCount=5, encoding='utf-8'), # 10MB, 5 backups
        logging.StreamHandler() # To also print to console
    ],
    force=True 
)

# Get a specific logger for this application module (app.py itself)
module_logger = logging.getLogger(__name__) # logger name will be 'app' if __name__ is '__main__'

app = Flask(__name__)

# Make Flask's default logger use our handlers and level.
# This ensures Flask's internal logs (request handling, errors) go to file/format.
# Remove default Flask handlers first if any were added before basicConfig.
if app.logger.hasHandlers():
    app.logger.handlers.clear()

for handler in logging.getLogger().handlers: # Get handlers from the root logger
    app.logger.addHandler(handler)
app.logger.setLevel(logging.DEBUG) # Match root logger's level or set as needed

CORS(app)
Compress(app)

# --- AWS Cognito Configuration for Flask Backend ---
app.config['AWS_COGNITO_REGION'] = os.getenv('AWS_COGNITO_REGION') # e.g., 'us-east-1'
app.config['AWS_DEFAULT_REGION'] = os.getenv('AWS_DEFAULT_REGION')
app.config['AWS_COGNITO_DOMAIN'] = os.getenv('AWS_COGNITO_DOMAIN')
app.config['AWS_COGNITO_USER_POOL_ID'] = os.getenv('AWS_COGNITO_USER_POOL_ID') # e.g., 'us-east-1_xxxxxxxxx'
# IMPORTANT: Frontend app client ID should be used here, NOT a server-side one
app.config['AWS_COGNITO_USER_POOL_CLIENT_ID'] = os.getenv('AWS_COGNITO_USER_POOL_CLIENT_ID') # e.g., 'yyyyyyyyyyyyyyyyyyyy'
app.config['AWS_COGNITO_USER_POOL_CLIENT_SECRET'] = os.getenv('AWS_COGNITO_USER_POOL_CLIENT_SECRET', '')
app.config['AWS_COGNITO_REDIRECT_URL'] = os.getenv('AWS_COGNITO_REDIRECT_URL')
app.config['AWS_COGNITO_CHECK_TOKEN_EXPIRATION'] = True # Recommended for security
app.config['AWS_COGNITO_JWT_HEADER_NAME'] = 'Authorization' # Default is 'Authorization'
app.config['AWS_COGNITO_JWT_HEADER_PREFIX'] = 'Bearer' # Default is 'Bearer'

# Initialize AWSCognitoAuthentication
aws_auth = AWSCognitoAuthentication(app)

# Initializing RAG service
rag_service_instance = None
try:
    module_logger.info("Attempting to initialize RAGService...")
    rag_service_instance = RAGService()
    module_logger.info("RAGService initialized successfully.")
except ValueError as e:
    module_logger.critical(f"CRITICAL: RAGService initialization failed due to ValueError: {e}")
except Exception as e: # Catch any other unexpected error during init
    module_logger.critical(f"CRITICAL: Unexpected error during RAGService initialization: {e}", exc_info=True)
    # import traceback
    # traceback.print_exc()

@app.route('/api/index', methods=['POST'])
@aws_auth.authentication_required # Protect this endpoint
def index_documents_endpoint():
    """
    Endpoint to index PDF documents using RAGService.
    Protected: Only authenticated users can access.
    """
    # jwt_claims = aws_auth.get_claims()
    # user_id = jwt_claims.get('sub') # The 'sub' claim is the user's unique ID
    # user_email = jwt_claims.get('email') # Get email if available in claims
    # user_given_name = jwt_claims.get('given_name', 'N/A') # Get given_name if available

    # app.logger.info(f"'/api/index' endpoint hit by authenticated user: {user_id} (Email: {user_email}, Name: {user_given_name}) from {request.remote_addr}")
    # app.logger.info(f"'/api/index' endpoint hit by authenticated user: {user_id} from {request.remote_addr}")
    app.logger.info(f"'/api/index' endpoint hit by {request.remote_addr}")
    if rag_service_instance is None:
        app.logger.error("RAGService not available for '/api/index' due to initialization failure.")
        return jsonify({"error": "RAGService is not available due to an initialization error."}), 503

    data = request.json
    # Your index_document.py uses default='../pdfs'
    pdf_directory_relative = data.get('directory', '../pdfs')
    app.logger.debug(f"Received PDF directory for indexing: '{pdf_directory_relative}'") 
    
    # Resolve path relative to the script file's directory for robustness
    script_dir = os.path.dirname(__file__) # Directory of app.py
    pdf_directory_abs = os.path.abspath(os.path.join(script_dir, pdf_directory_relative))
    app.logger.info(f"Resolved absolute PDF directory path for indexing: '{pdf_directory_abs}'")

    if not os.path.isdir(pdf_directory_abs):
        app.logger.warning(f"Directory not found for indexing: '{pdf_directory_abs}'")
        return jsonify({"error": f"Directory not found or is not a directory: {pdf_directory_abs}"}), 404
    
    try:
        app.logger.info(f"Calling RAGService.index_documents for directory: '{pdf_directory_abs}'")
        # print(f"Indexing request for directory: {pdf_directory_abs}")
        num_indexed = rag_service_instance.index_documents(pdf_directory_abs)
        response_data = {"success": True, "message": f"Indexing complete. Processed chunks: {num_indexed}"}
        app.logger.info(f"Indexing successful for '{pdf_directory_abs}': {response_data}") 
        return jsonify(response_data)
    except Exception as e:
        app.logger.error(f"Error during '/api/index' execution for directory '{pdf_directory_abs}': {e}", exc_info=True)
        # import traceback
        # traceback.print_exc()
        return jsonify({"error": f"Indexing failed: {str(e)}"}), 500

@app.route('/api/chat', methods=['POST'])
@aws_auth.authentication_required # Protect this endpoint
def chat_endpoint():
    """
    Endpoint to handle chat messages. Now expects 'chat_history' in the request.
    Protected: Only authenticated users can access.
    """
    # jwt_claims = aws_auth.get_claims()
    # user_id = jwt_claims.get('sub') # The 'sub' claim is the user's unique ID
    # user_email = jwt_claims.get('email') # Get email if available in claims
    # user_given_name = jwt_claims.get('given_name', 'N/A') # Get given_name if available, default to 'N/A'

    # app.logger.info(f"'/api/chat' endpoint hit by authenticated user: {user_id} (Email: {user_email}, Name: {user_given_name}) from {request.remote_addr}")
    # app.logger.info(f"'/api/chat' endpoint hit by authenticated user: {user_id} from {request.remote_addr}")
    app.logger.info(f"'/api/chat' endpoint hit by {request.remote_addr}")
    if rag_service_instance is None:
        app.logger.error("RAGService not available for '/api/chat' due to initialization failure.")
        return jsonify({"error": "RAGService is not available due to an initialization error."}), 503

    data = request.json
    user_message = data.get('message', '')
    chat_history_from_frontend = data.get('chat_history', []) 
    
    app.logger.debug(f"Received user message for chat: '{user_message}'")
    app.logger.debug(f"Received chat history length: {len(chat_history_from_frontend)}")
    if chat_history_from_frontend and app.logger.isEnabledFor(logging.DEBUG): # Avoid processing if not logging debug
        # Log only a summary or last few messages if history is long
        history_summary = [f"{msg['sender']}: {msg['text'][:30]}..." for msg in chat_history_from_frontend[-2:]]
        app.logger.debug(f"Last 2 chat history items (summary): {history_summary}")
    
    if not user_message:
        app.logger.warning("Empty message received for '/api/chat'.")
        return jsonify({"error": "Empty message received"}), 400
    
    try:
        app.logger.info(f"Calling RAGService.generate_response for user message: '{user_message[:50]}...'")
        ai_response_text = rag_service_instance.generate_response(user_message, chat_history_from_frontend)
        response_data = {"response": ai_response_text}

        ai_response_snippet = (ai_response_text[:75] + '...') if len(ai_response_text) > 75 else ai_response_text
        app.logger.info(f"AI response generated successfully (snippet): '{ai_response_snippet}'")
        return jsonify(response_data) # Matching original key
    except Exception as e:
        app.logger.error(f"Error during '/api/chat' execution for message '{user_message[:50]}...': {e}", exc_info=True)
        # import traceback
        # traceback.print_exc()
        return jsonify({"error": f"An internal server error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    module_logger.info("Flask application starting in debug mode (app.py as __main__)...")
    if rag_service_instance is None:
        module_logger.warning("Flask app is starting, but RAGService failed to initialize. Chat functionality will be impaired.")
    
    # use_reloader=False is crucial with custom logging setup in debug mode
    # to prevent the logging configuration from running twice or causing issues.
    app.run(debug=True, port=5000)
    module_logger.info("Flask application has stopped.")