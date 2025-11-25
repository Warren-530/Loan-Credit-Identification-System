import os
import sys
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

def check_ai():
    print("Checking AI Configuration...")
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ ERROR: GEMINI_API_KEY not found in environment variables.")
        return False
        
    print(f"✓ API Key found: {api_key[:10]}...")
    
    try:
        genai.configure(api_key=api_key)
        
        print("Listing available models...")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name}")
        
        # Try a fallback model if the specific one fails
        model_name = 'models/gemini-2.0-flash'
        print(f"\nTesting with model: {model_name}")
        model = genai.GenerativeModel(model_name)
        
        print("Sending test request to Gemini...")
        response = model.generate_content("Reply with only the word 'Working'.")
        
        if response and response.text:
            print(f"✓ AI Response received: {response.text.strip()}")
            return True
        else:
            print("❌ ERROR: No response text received.")
            return False
            
    except Exception as e:
        print(f"❌ AI Connection Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = check_ai()
    if success:
        print("\n✅ AI System is operational.")
        sys.exit(0)
    else:
        print("\n❌ AI System check FAILED.")
        sys.exit(1)
