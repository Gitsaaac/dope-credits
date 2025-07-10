from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Database setup
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data.db'
db = SQLAlchemy(app)

# Timer state (not stored in DB)
timer_start = None

# Model
class UserState(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    total_work_minutes = db.Column(db.Integer, default=0)
    used_movie = db.Column(db.Integer, default=0)
    used_youtube = db.Column(db.Integer, default=0)
    used_instagram = db.Column(db.Integer, default=0)
    used_snack_money = db.Column(db.Float, default=0.0)
    
#creates userstate 1 if it doesn't exist
with app.app_context():
    db.create_all()
    if UserState.query.get(1) is None:
        db.session.add(UserState(id=1))
        db.session.commit()

def calculate_rewards(state):
    reward_units = state.total_work_minutes // 60
    return {
        "movie": reward_units * 10 - state.used_movie,
        "youtube": reward_units * 5 - state.used_youtube,
        "instagram": reward_units * 1 - state.used_instagram,
        "snack_money": round(reward_units * 1.0 - state.used_snack_money, 2)
    }

@app.route('/start', methods=['POST'])
def start_timer():
    global timer_start
    timer_start = datetime.now()
    return jsonify({"message": "Timer started."})

@app.route('/stop', methods=['POST'])
def stop_timer():
    global timer_start
    if timer_start is None:
        return jsonify({"error": "Timer was not started."}), 400

    now = datetime.now()
    duration = int((now - timer_start).total_seconds() / 60)
    timer_start = None

    state = UserState.query.get(1) #id is 1 (assuming 1 user)
    state.total_work_minutes += duration
    db.session.commit()

    rewards = calculate_rewards(state)

    return jsonify({
        "worked_minutes": duration,
        "total_work_minutes": state.total_work_minutes,
        "rewards": rewards
    })

@app.route('/use_reward', methods=['POST'])
def use_reward():
    data = request.json
    reward_type = data.get("type")
    amount = data.get("amount")

    state = UserState.query.get(1)

    if reward_type == "movie":
        state.used_movie += amount
    elif reward_type == "youtube":
        state.used_youtube += amount
    elif reward_type == "instagram":
        state.used_instagram += amount
    elif reward_type == "snack_money":
        state.used_snack_money += amount
    else:
        return jsonify({"error": "Invalid reward type"}), 400

    db.session.commit()
    rewards = calculate_rewards(state)

    return jsonify({"message": f"{amount} {reward_type} used.",
                    "rewards":rewards
                })

@app.route('/manual_add', methods=['POST'])
def manual_add():
    data = request.json #request gets data from frontend, when it makes http request to backend
    minutes = data.get("minutes", 0)

    state = UserState.query.get(1)
    state.total_work_minutes += minutes
    db.session.commit()

    rewards = calculate_rewards(state)
    return jsonify({
        "message": f"{minutes} minutes added.",
        "total_work_minutes": state.total_work_minutes,
        "rewards": rewards
    })

@app.route('/status', methods=['GET'])
def get_status():
    state = UserState.query.get(1)
    rewards = calculate_rewards(state)
    return jsonify({
        "timer_running": timer_start is not None,
        "total_work_minutes": state.total_work_minutes,
        "rewards": rewards
    })

if __name__ == '__main__':
    app.run(debug=True)
