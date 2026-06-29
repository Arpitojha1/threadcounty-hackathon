import random
import time

def analyze_fabric_image(file_name: str):
    """
    Simulates a 2-second AI processing delay and returns
    production-ready mock data for textile analysis.
    """
    time.sleep(2) # Simulate AI processing time
    
    fabric_types = ["Cotton Twill", "Polyester Blend", "Denim", "Silk Charmeuse", "Linen"]
    
    result = {
        "thread_density": round(random.uniform(30.0, 150.0), 2),
        "warp_count": random.randint(20, 80),
        "weft_count": random.randint(20, 80),
        "fabric_type": random.choice(fabric_types),
        "confidence_score": round(random.uniform(88.5, 99.9), 2),
        "ai_suggestions": [
            "Weave tension appears uniform.",
            "No surface defects detected."
        ]
    }
    print("MOCK AI RESULT 'ai_suggestions':", type(result["ai_suggestions"]), result["ai_suggestions"])
    return result