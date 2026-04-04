from flask import Flask, render_template, redirect, url_for, request, session

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'

lessons = {
    1: {"title": "Safety First", "content": ""},
    2: {"title": "Nutrition Flip Cards!", "content": "Choose a category to practice."},
    3: {"title": "Pasta Mastery", "content": "Step-by-step pasta cooking guide."}
}

ingredients = {
    "protein": [
        {"id": "eggs",   "name": "Eggs",             "calories": 70,  "protein_g": 6,  "fats_g": 5,  "nutrients": ["B12", "Selenium"]},
        {"id": "salmon", "name": "Salmon",           "calories": 206, "protein_g": 23, "fats_g": 12, "nutrients": ["Vitamin D", "B12", "Omega-3s"]},
        {"id": "beef",   "name": "Beef (90% lean)", "calories": 180, "protein_g": 22, "fats_g": 9,  "nutrients": ["Iron", "Zinc", "Vitamin B12"]},
        {"id": "tofu",   "name": "Tofu",            "calories": 190, "protein_g": 20, "fats_g": 12, "nutrients": ["Calcium", "Iron"]},
        {"id": "chicken","name": "Chicken",         "calories": 165, "protein_g": 31, "fats_g": 3.6,"nutrients": ["Vitamin B6", "Niacin"]}
    ], 
    "vegetable": [
        {"id": "bell_peppers","name": "Bell Peppers","calories": 45,  "protein_g": 1,  "fats_g": 0, "nutrients": ["Vitamin A", "Vitamin C"]},
        {"id": "broccoli",    "name": "Broccoli",    "calories": 55,  "protein_g": 4,  "fats_g": 0, "nutrients": ["Vitamin C", "Vitamin K"]},
        {"id": "bok_choy",    "name": "Bok Choy",    "calories": 20,  "protein_g": 2,  "fats_g": 0, "nutrients": ["Vitamin A", "Vitamin C"]},
        {"id": "carrots",     "name": "Carrots",     "calories": 50,  "protein_g": 1,  "fats_g": 0, "nutrients": ["Beta-carotene", "Vitamin A", "Vitamin K"]},
        {"id": "spinach",     "name": "Spinach",     "calories": 7,   "protein_g": 1,  "fats_g": 0, "nutrients": ["Iron", "Vitamin K", "Folate"]}
    ],
    "base": [
        {"id": "udon_noodles",   "name": "Udon Noodles",      "calories": 210, "protein_g": 7,  "fats_g": 1,   "nutrients": []},
        {"id": "whole_wheat_bread","name": "Whole Wheat Bread","calories": 100, "protein_g": 4,  "fats_g": 1.2, "nutrients": ["Fiber", "Iron", "B Vitamins"]},
        {"id": "sweet_potato",   "name": "Sweet Potato",      "calories": 100, "protein_g": 2,  "fats_g": 0.1, "nutrients": ["Beta-carotene", "Vitamin A", "Vitamin C", "Fiber"]},
        {"id": "brown_rice",     "name": "Brown Rice",        "calories": 215, "protein_g": 5,  "fats_g": 1.8, "nutrients": ["Magnesium", "B Vitamins", "Fiber"]},
        {"id": "white_rice",     "name": "White Rice",        "calories": 200, "protein_g": 4,  "fats_g": 0.4, "nutrients": []}
    ]
}

quizzes = {
    1: {
        "question": "Which of the following is a key kitchen safety rule?",
        "options": ["Use one cutting board for all ingredients", "Never check food temperature", "Wash hands before handling food", "Skip cleaning work surfaces"],
        "answer": "Wash hands before handling food"
    },
    2: {
        "question": "What is the main purpose of calories?",
        "options": ["Build muscles", "Improve digestion", "Provide energy for your body", "Support brain health"],
        "answer": "Provide energy for your body"
    },
    3: {
        "question": "Which protein source has the highest protein content per serving?",
        "options": ["Tofu", "Chicken", "Salmon", "Beef"],
        "answer": "Chicken"
    },
    4: {
        "question": "Which nutrient is essential for brain health?",
        "options": ["Fiber", "Fats", "Iron", "Vitamin A"],
        "answer": "Fats"
    },
    5: {
        "question": "What vitamin do carrots and sweet potatoes have in common?",
        "options": ["Vitamin K", "Vitamin D", "Vitamin A", "Vitamin B6"],
        "answer": "Vitamin A"
    },
    6: {
        "question": "Which vegetable provides the most protein per serving?",
        "options": ["Bell Peppers", "Broccoli", "Carrots", "Spinach"],
        "answer": "Broccoli"
    },
    7: {
        "question": "What is the first step in the pasta cooking process?",
        "options": ["Add salt", "Cook pasta", "Drain pasta", "Boil water"],
        "answer": "Boil water"
    },
    8: {
        "question": "Which base contains the highest number of calories per serving?",
        "options": ["Sweet Potato", "White Rice", "Udon Noodles", "Whole Wheat Bread"],
        "answer": "Udon Noodles"
    },
    9: {
        "question": "What nutrient is found in both salmon and eggs?",
        "options": ["Vitamin C", "Vitamin D", "Vitamin A", "Iron"],
        "answer": "Vitamin D"
    },
    10: {
        "question": "Which food contains both fiber and magnesium?",
        "options": ["Brown Rice", "Chicken", "Beef", "Broccoli"],
        "answer": "Brown Rice"
    }
}

CATEGORY_ORDER = ['protein', 'vegetable', 'base']

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/learn/<int:lesson_id>')
def learn(lesson_id):
    lesson = lessons.get(lesson_id)
    if not lesson:
        return redirect(url_for('home'))

    prev_id = lesson_id - 1 if lesson_id > 1 else None
    next_id = lesson_id + 1 if lesson_id < 3 else None

    if lesson_id == 1:
        return render_template('safety.html', title=lesson['title'])
    
    return render_template('learn.html',
                           lesson_id=lesson_id,
                           lesson=lesson,
                           ingredients=ingredients,
                           prev_id=prev_id,
                           next_id=next_id)

@app.route('/learn/<int:lesson_id>/<category>')
def flipcards(lesson_id, category):
    if lesson_id != 2 or category not in CATEGORY_ORDER:
        return redirect(url_for('learn', lesson_id=2))
    
    current_idx = CATEGORY_ORDER.index(category)
    prev_category = CATEGORY_ORDER[current_idx-1] if current_idx > 0 else None
    next_category = CATEGORY_ORDER[current_idx+1] if current_idx < len(CATEGORY_ORDER)-1 else None
    
    return render_template('ingredients.html',
                           category=category,
                           ingredients=ingredients[category],
                           lesson_id=lesson_id,
                           prev_category=prev_category,
                           next_category=next_category)

@app.route('/game', methods=['GET', 'POST'])
def game():
    if request.method == 'POST':
        # Game completion - redirect to first quiz question
        return redirect(url_for('quiz', quiz_id=1))
    return render_template('game.html')

@app.route('/quiz/<int:quiz_id>', methods=['GET', 'POST'])
def quiz(quiz_id):
    if request.method == 'POST':
        # Store answer in session
        session[f'answer_{quiz_id}'] = request.form.get('answer')
        
        if quiz_id < len(quizzes):
            return redirect(url_for('quiz', quiz_id=quiz_id+1))
        else:
            return redirect(url_for('results'))
    
    quiz = quizzes.get(quiz_id)
    if not quiz:
        return redirect(url_for('home'))
    
    return render_template('quiz.html',
                         quiz=quiz,
                         quiz_id=quiz_id,
                         total_quizzes=len(quizzes))

@app.route('/results', methods=['GET'])
def results():
    total = len(quizzes)
    score = 0
    
    # Calculate score from session data
    for i in range(1, total+1):
        user_answer = session.get(f'answer_{i}')
        correct_answer = quizzes[i]['answer']
        if user_answer == correct_answer:
            score += 1
    
    # Clear quiz session data
    for key in list(session.keys()):
        if key.startswith('answer_'):
            session.pop(key)
    
    return render_template('results.html',
                         score=score,
                         total=total)

if __name__ == '__main__':
    app.run(debug=True, port=5001)