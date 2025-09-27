from fastapi import FastAPI
import uvicorn

from dotenv import load_dotenv
load_dotenv('.env')

from app.controller import voice_risk_detector_controller
from app.controller import notifier_controller
from app.controller import mobility_anomaly_detector_controller
from app.controller import tracking_manager_controller
from app.controller import location_risk_detector_controller
from app.controller import tracking_controller
app = FastAPI()

app.include_router(voice_risk_detector_controller.router)
app.include_router(notifier_controller.router)
app.include_router(mobility_anomaly_detector_controller.router)
app.include_router(tracking_manager_controller.router)
app.include_router(location_risk_detector_controller.router)
app.include_router(tracking_controller.router)

def main():
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()