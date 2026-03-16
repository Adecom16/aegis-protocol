import random

class AnomalyModel:
    def __init__(self):
        self.model_loaded = True
        print("Anomaly AI Model initialized.")

    def predict_risk(self, transaction_data):
        # Mock prediction logic returning a risk score between 0 and 100
        print("Predicting transaction risk using AI model...")
        return random.uniform(0, 100)

if __name__ == "__main__":
    model = AnomalyModel()
    mock_data = {"to": "0xDefiContract", "value": 1000}
    score = model.predict_risk(mock_data)
    print(f"Predicted Risk Score: {score:.2f}")
