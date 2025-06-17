#logging
import logging
from logging.handlers import RotatingFileHandler

import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_compress import Compress
import os
from dotenv import load_dotenv
from rag_service import RAGService
from flask_awscognito import AWSCognitoAuthentication
import boto3
import json
import math

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

AWS_REGION_FOR_CLIENTS = os.getenv("REGION_NAME", "us-east-1")
LOCATION_PLACE_INDEX_NAME = os.getenv("AWS_LOCATION_PLACE_INDEX_NAME")
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

location_client = None
if LOCATION_PLACE_INDEX_NAME:
    try:
        location_client = boto3.client('location', region_name=AWS_REGION_FOR_CLIENTS)
        module_logger.info(f"Amazon Location Service client initialized.")
    except Exception as e:
        module_logger.error(f"Failed to initialize Amazon Location Service client: {e}", exc_info=True)
else:
    module_logger.warning("AWS_LOCATION_PLACE_INDEX_NAME not set. Vet finding feature will be disabled.")

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

@app.route('/api/find_vets', methods=['POST'])
@aws_auth.authentication_required # Protect this endpoint
def find_vets_api():
    app.logger.info(f"'/api/find_vets' endpoint hit by {request.remote_addr}")
    if not location_client or not LOCATION_PLACE_INDEX_NAME:
        return jsonify({"error": "Vet finding service unavailable/not configured."}), 503
    data = request.json
    latitude, longitude = data.get('latitude'), data.get('longitude')
    if latitude is None or longitude is None: return jsonify({"error": "Latitude/longitude required."}), 400
    try:
        # --- FIX: Calculate a bounding box to filter results ---
        radius_km = 50  # Search within a 50km radius (approx. 30 miles)
        lat_delta = radius_km / 111.0
        lon_delta = radius_km / (111.0 * math.cos(math.radians(latitude)))

        min_lon = longitude - lon_delta
        min_lat = latitude - lat_delta
        max_lon = longitude + lon_delta
        max_lat = latitude + lat_delta
        # ---------------------------------------------------------

        app.logger.info(f"Searching for vets near ({latitude}, {longitude}) using ALS index '{LOCATION_PLACE_INDEX_NAME}'.")

        search_text = 'veterinary animal pet clinic hospital vet'
        search_params = {
            'IndexName': LOCATION_PLACE_INDEX_NAME, 
            # 'BiasPosition': [float(longitude), float(latitude)],
            # FIX: Add the FilterBBox parameter to restrict the search area
            'FilterBBox': [min_lon, min_lat, max_lon, max_lat], 
            'MaxResults': 20,
            'Text': search_text,
        }
        response = location_client.search_place_index_for_text(**search_params)
        vets = []
        for place_result in response.get('Results', []):
            place = place_result.get('Place', {})

            # Safer way to parse the address label
            label_parts = place.get('Label', '').split(', ', 1)
            vet_name = label_parts[0]
            vet_address = label_parts[1] if len(label_parts) > 1 else ''

            vet_info = {
                "id": place.get('PlaceId'), 
                "name": vet_name,
                "address": vet_address,
                "longitude": place.get('Geometry', {}).get('Point', [None, None])[0],
                "latitude": place.get('Geometry', {}).get('Point', [None, None])[1],
                "phone": place.get('PhoneNumber')
            }
            
            if vet_info["name"]:
                vets.append(vet_info)
            
        app.logger.info(f"Found {len(vets)} potential veterinary locations.")
        # If no vets are found, add a helpful error message to the frontend.
        # if not vets:
        #     setLocationError("No veterinary clinics were automatically found within a 30-mile radius. Please try a manual search.")

        return jsonify({"success": True, "vets": vets})
    except Exception as e:
        app.logger.error(f"Error in /api/find_vets: {e}", exc_info=True)
        return jsonify({"error": "Failed to find nearby vets due to a server error."}), 500

@app.route('/api/search_vets_by_text', methods=['POST'])
@aws_auth.authentication_required
def search_vets_by_text_api():
    app.logger.info(f"'/api/search_vets_by_text' endpoint hit by {request.remote_addr}")
    if not location_client or not LOCATION_PLACE_INDEX_NAME:
        return jsonify({"error": "Vet finding service unavailable/not configured."}), 503

    data = request.json
    query = data.get('query')
    if not query:
        return jsonify({"error": "A search query is required."}), 400

    try:
        # Prepend search terms to the user's location query for better results
        search_text = f"veterinarian or vet in {query}"
        app.logger.info(f"Searching for vets with text query: '{search_text}'")

        search_params = {
            'IndexName': os.getenv("AWS_LOCATION_PLACE_INDEX_NAME"),
            'Text': search_text,
            'FilterCountries': ['USA'], # Optional: Filter results to a specific country
            'MaxResults': 10,
            'Language': 'en'
        }

        response = location_client.search_place_index_for_text(**search_params)

        vets = []
        for place_result in response.get('Results', []):
            place = place_result.get('Place', {})
            
            label_parts = place.get('Label', '').split(', ', 1)
            vet_name = label_parts[0]
            vet_address = label_parts[1] if len(label_parts) > 1 else ''

            vet_info = {
                "id": place.get('PlaceId'), 
                "name": vet_name,
                "address": vet_address,
                "longitude": place.get('Geometry', {}).get('Point', [None, None])[0],
                "latitude": place.get('Geometry', {}).get('Point', [None, None])[1],
                "phone": place.get('PhoneNumber')
            }
            if vet_info["name"]: 
                vets.append(vet_info)

        app.logger.info(f"Found {len(vets)} vets for text query '{query}'.")
        return jsonify({"success": True, "vets": vets})

    except Exception as e:
        app.logger.error(f"An unexpected error occurred in /api/search_vets_by_text: {e}", exc_info=True)
        return jsonify({"error": "Failed to find nearby vets due to a server error."}), 500

@app.route('/api/chat', methods=['POST'])
@aws_auth.authentication_required # Protect this endpoint
def chat_endpoint():
    app.logger.info(f"'/api/chat' endpoint hit by {request.remote_addr}")
    if rag_service_instance is None:
        return jsonify({"error": "RAGService is not available. Please check server logs."}), 503

    content_type_header = request.headers.get('Content-Type', '').lower()
    user_message = ''
    chat_history_from_frontend = []
    image_data_base64 = None

    if 'multipart/form-data' in content_type_header:
        app.logger.debug("Processing chat request as multipart/form-data.")
        user_message = request.form.get('message', '')
        chat_history_str = request.form.get('chat_history', '[]')
        try:
            chat_history_from_frontend = json.loads(chat_history_str)
        except json.JSONDecodeError:
            chat_history_from_frontend = []

        if 'image' in request.files:
            image_file = request.files['image']
            if image_file and image_file.filename != '':
                image_bytes = image_file.read()
                image_data_base64 = base64.b64encode(image_bytes).decode('utf-8')
                app.logger.info(f"Image '{image_file.filename}' received and converted to base64.")
    else: # JSON
        app.logger.debug("Processing chat request as application/json.")
        data = request.json
        user_message = data.get('message', '')
        chat_history_from_frontend = data.get('chat_history', [])
        
    if not user_message and not image_data_base64:
        return jsonify({"error": "Please provide a message or an image."}), 400
        
    if not user_message and image_data_base64:
        user_message = "User uploaded an image of a pet's skin condition for analysis."
        
    try:
        structured_ai_response = rag_service_instance.generate_response(
            user_message, chat_history_from_frontend, image_data_base64=image_data_base64
        )
        return jsonify(structured_ai_response)
    except Exception as e:
        app.logger.error(f"Error in /api/chat execution: {e}", exc_info=True)
        return jsonify({"urgency": "ERROR", "message": "An internal server error occurred."}), 500

if __name__ == '__main__':
    module_logger.info("Flask application starting in debug mode (app.py as __main__)...")
    if rag_service_instance is None:
        module_logger.warning("Flask app is starting, but RAGService failed to initialize. Chat functionality will be impaired.")
    
    # use_reloader=False is crucial with custom logging setup in debug mode
    # to prevent the logging configuration from running twice or causing issues.
    app.run(debug=True, port=5000)
    module_logger.info("Flask application has stopped.")