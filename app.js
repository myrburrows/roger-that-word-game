import { COMMONWORDS } from './data/commonwords.js';
import { MYWORD5 } from './data/myword5.js';
import { MYWORD6 } from './data/myword6.js';
import { MYWORD7 } from './data/myword7.js';

const gameBoard = document.getElementById("game-board");
const message = document.getElementById("message");
const eligibleWordsBox = document.getElementById("eligible-words-box");
const eligibleWordsContainer = document.getElementById("eligible-words");

fetch('https://roger-that-bridge-flashcards-5bffcbb5d89a.herokuapp.com/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_name: 'roger-that-word-game' })
});

let currentRow = 0;
let currentBox = 0;
let score = 0; // Initialize the score variable
let guessCount = 0; // Track the number of guesses
let eligibleWordsVisible = false; // Track visibility state of eligible words
let eligibleWordsUsed = false; // Tracks whether the Eligible Words box was toggled

// Get today's word based on date offset
function getDailyWord() {
    const startDate = new Date(2024, 9, 30); // October 30, 2024 (0-indexed month)
    const today = new Date();
    const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const wordIndex = daysSinceStart % COMMONWORDS.length;
    const dailyWord = COMMONWORDS[wordIndex];
    return dailyWord;
}

const dailyWord = getDailyWord();
const wordLength = dailyWord.length;
let eligibleWords = Array.from(wordLength === 5 ? MYWORD5 : wordLength === 6 ? MYWORD6 : MYWORD7);

// Ensure the contents of the box are hidden by default
eligibleWordsContainer.style.display = "none";

// Toggle eligible-words-box contents visibility when clicked
eligibleWordsBox.addEventListener("click", () => {
    eligibleWordsVisible = !eligibleWordsVisible;
    eligibleWordsContainer.style.display = eligibleWordsVisible ? "block" : "none";
    if (eligibleWordsVisible) {
        eligibleWordsUsed = true; // Mark as used when toggled ON
        displayEligibleWords();
    }
});

// Initialize the game board with rows and boxes
function createRows() {
    for (let i = 0; i < 4; i++) { // 4 rows for guesses
        const row = document.createElement("div");
        row.classList.add("row");
        row.dataset.rowIndex = i;

        for (let j = 0; j < wordLength; j++) {
            const box = document.createElement("div");
            box.classList.add("letter-box");
            box.setAttribute("contenteditable", "true");
            box.dataset.boxIndex = j;
            box.addEventListener("input", handleLetterInput);
            row.appendChild(box);
        }
        gameBoard.appendChild(row);
    }
}

// Set the date heading
function setDateHeading() {
    const dateHeading = document.getElementById("date-heading");
    const options = { weekday: 'long', month: '2-digit', day: '2-digit', year: 'numeric' };
    const today = new Date().toLocaleDateString('en-US', options);
    dateHeading.textContent = today;
}

// Handle letter input in each box and convert to uppercase
function handleLetterInput(event) {
    const box = event.target;
    box.textContent = box.textContent.toUpperCase();
    if (box.textContent.length > 1) {
        box.textContent = box.textContent[0];
    }
    moveToNextBox();
}

// Move focus to the next box within the same row
function moveToNextBox() {
    const boxes = document.querySelectorAll(`.row[data-row-index='${currentRow}'] .letter-box`);
    if (currentBox < wordLength - 1) {
        currentBox++;
        boxes[currentBox].focus();
    }
}

// Process the guess upon Enter key press
function submitGuess() {
    const row = document.querySelector(`.row[data-row-index='${currentRow}']`);
    const guess = Array.from(row.children).map(box => box.textContent.trim().toLowerCase()).join("");

    if (guess.length === wordLength && isValidGuess(guess)) {
        guessCount++; // Increment the guess count
        checkGuess(guess);

        if (guess === dailyWord) {
            calculateScore(true); // Pass true since the guess is correct
            displayScore();
            endGame();
        } else {
            currentRow++;
            currentBox = 0;

            // Update eligible words and display them if the box is toggled on
            updateEligibleWords(guess);
            if (eligibleWordsVisible) {
                displayEligibleWords();
            }

            // Check if max guesses are reached
            if (currentRow < 4) {
                displayNextRow();
            } else {
                calculateScore(false); // Pass false since all attempts failed
                displayScore();
                endGame();
            }
        }
    } else {
        message.textContent = "Enter a valid word";
    }
}

// Display the first box in the next row
function displayNextRow() {
    const nextRowFirstBox = document.querySelector(`.row[data-row-index='${currentRow}'] .letter-box[data-box-index='0']`);
    nextRowFirstBox.focus();
}

// Calculate the score based on the number of guesses and whether Eligible Words were used
function calculateScore(isCorrect) {
    if (!isCorrect) {
        score = 0; // No score if the user never guesses correctly
    } else {
        switch (guessCount) {
            case 1:
                score = 100;
                break;
            case 2:
                score = 95;
                break;
            case 3:
                score = 90;
                break;
            case 4:
                score = 85;
                break;
            default:
                score = 0; // Just a fallback, should never reach here if isCorrect is true
        }

        // Apply a 20-point penalty if Eligible Words were used
        if (eligibleWordsUsed) {
            score -= 20;
        }
    }
}

// Display the final score with feedback about Eligible Words usage
function displayScore() {
    const eligibleWordsMessage = eligibleWordsUsed
        ? "Eligible Words = ON."
        : "Eligible Words = OFF.";
    message.textContent = `Game Over! Your score: ${score}%. ${eligibleWordsMessage}`;
}

// Check if the guess matches the daily word
function checkGuess(guess) {
    const row = document.querySelector(`.row[data-row-index='${currentRow}']`);
    Array.from(row.children).forEach((box, i) => {
        if (guess[i] === dailyWord[i]) {
            box.classList.add("correct");
        } else if (dailyWord.includes(guess[i])) {
            box.classList.add("present");
        } else {
            box.classList.add("absent");
        }
    });
}

// Filter eligible words based on the current guess
function updateEligibleWords(guess) {
    eligibleWords = eligibleWords.filter(word => {
        for (let i = 0; i < wordLength; i++) {
            if (guess[i] === dailyWord[i]) {
                if (word[i] !== guess[i]) return false;
            } else if (dailyWord.includes(guess[i])) {
                if (word[i] === guess[i] || !word.includes(guess[i])) return false;
            } else {
                if (word.includes(guess[i])) return false;
            }
        }
        return true;
    });
}

// Display eligible words in the eligible words box
function displayEligibleWords() {
    eligibleWordsContainer.innerHTML = eligibleWords.join(", ");
}

// Validate if guess exists in the appropriate word list
function isValidGuess(guess) {
    const wordList = wordLength === 5 ? MYWORD5 : wordLength === 6 ? MYWORD6 : MYWORD7;
    return wordList.includes(guess);
}

// End game after max guesses
function endGame() {
    document.querySelectorAll('.letter-box').forEach(box => box.setAttribute('contenteditable', 'false'));
}

// Add a single keydown event listener to manage both Enter and Backspace
document.addEventListener("keydown", (event) => {
    if (event.key === "Backspace") {
        handleBackspace(event);
    } else if (event.key === "Enter") {
        event.preventDefault();
        submitGuess();
    }
});

// Handle Backspace key to move back and clear letter
function handleBackspace(event) {
    if (event.key === "Backspace") {
        const boxes = document.querySelectorAll(`.row[data-row-index='${currentRow}'] .letter-box`);
        if (currentBox > 0 || boxes[currentBox].textContent !== "") {
            if (boxes[currentBox].textContent === "" && currentBox > 0) {
                currentBox--;
            }
            boxes[currentBox].textContent = "";
            boxes[currentBox].focus();
            event.preventDefault();
        }
    }
}

// Initialize the game board and date heading
setDateHeading();
createRows();
document.querySelector(`.row[data-row-index='0'] .letter-box[data-box-index='0']`).focus();
