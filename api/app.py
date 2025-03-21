# import cvzone
# import math

from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
from ultralytics import YOLO
import numpy as np
import base64
import cv2
import math

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the YOLO model
model = YOLO('../model/epoch175.pt')

@app.route('/detect', methods=['POST'])
def detect():
    # Get image from request
    data = request.json
    image_data = data['image']
    
    # Decode image
    img_data = base64.b64decode(image_data)
    img_array = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    # Process image with YOLO
    results = model(img, stream=True)
    class_names = ['Longitudinal Crack', 'Transverse Crack', 'Alligator Crack', 'Pothole'] 
    
    detections = []

    for r in results:
        boxes = r.boxes
        for box in boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])  # bounding box
            
            # Use item() to convert tensor to a Python number
            conf = box.conf[0].item()  # confidence
            conf = round(conf, 2)  # now you can round it

            cls = int(box.cls[0])  # class
            label = f"{class_names[cls]} {conf}"

            # Draw bounding box on the image
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)  # Green bounding box
            cv2.putText(img, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

            detections.append({
                "box": [x1, y1, x2, y2],
                "label": label
            })
    
    # Encode the image with bounding boxes back to base64 for response
    _, buffer = cv2.imencode('.jpeg', img)
    annotated_image_data = base64.b64encode(buffer).decode('utf-8')

    return jsonify({
        "detections": detections,
        "annotated_image": annotated_image_data 
    })

if __name__ == "__main__":
    app.run(debug=True)


# model = YOLO('../model/best.pt')


# cap = cv2.VideoCapture(0)
# cap.set(3, 640)
# cap.set(4, 640)

# classNames = ['Longitudinal Crack', 'Transverse Crack', 'Alligator Crack', 'Pothole']

# while True:
#     success, img = cap.read()
#     results = model(img, stream=True)
#     for r in results:
#         boxes = r.boxes
#         for box in boxes:
#             #bounding box
#             x1, y1, x2, y2 = box.xyxy[0]
#             x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
#             w, h = x2 - x1, y2 - y1
#             cvzone.cornerRect(img,(x1, y1, w, h), l=10)

#             #confidence
#             conf = math.ceil((box.conf[0]*100))/100

#             # labels
#             cls = int(box.cls[0])
#             cvzone.putTextRect(img, f'{classNames[cls]} {conf}', (max(0, x1), max(35, y1)),
#                                 scale=1, thickness=2, offset=10)
            
#     cv2.imshow("Image", img)
#     cv2.waitKey(1)