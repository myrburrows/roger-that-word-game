import { COMMONWORDS } from './data/commonwords.js';
import { MYWORD5 } from './data/myword5.js';
import { MYWORD6 } from './data/myword6.js';
import { MYWORD7 } from './data/myword7.js';

const gameBoard = document.getElementById("game-board");
const message = document.getElementById("message");
const eligibleWordsBox = document.getElementById("eligible-words-box");
const eligibleWordsContainer = document.getElementById("eligible-words");

let currentRow = 0;
let currentBox = 0;

// Get today's word based on date offset
function getDailyWord() {
    const startDate = new Date(2024, 9, 30); // October 30, 2024 (0-indexed month)
    const today = new Date();
    const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const wordIndex = daysSinceStart % COMMONWORDS.length;
    const dailyWord = COMMONWORDS[wordIndex];
//    console.log("Word to guess:", dailyWord); // Log the selected daily word for verification
    return dailyWord;
}

const dailyWord = getDailyWord();
const wordLength = dailyWord.length;
let eligibleWords = Array.from(wordLength === 5 ? MYWORD5 : wordLength === 6 ? MYWORD6 : MYWORD7);

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
        checkGuess(guess);
        currentRow++;
        currentBox = 0;

        // Filter and display eligible words after each guess
        updateEligibleWords(guess);
        displayEligibleWords();

        if (currentRow < 4) {
            const nextRowFirstBox = document.querySelector(`.row[data-row-index='${currentRow}'] .letter-box[data-box-index='0']`);
            nextRowFirstBox.focus();
        } else {
            endGame();
        }
    } else {
        message.textContent = "Enter a valid word";
    }
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
                // Letter is correct and in the correct position
                if (word[i] !== guess[i]) return false;
            } else if (dailyWord.includes(guess[i])) {
                // Letter is correct but in the wrong position
                if (word[i] === guess[i] || !word.includes(guess[i])) return false;
            } else {
                // Letter is absent in the daily word
                if (word.includes(guess[i])) return false;
            }
        }
        return true;
    });
}

// Display eligible words in the eligible words box
function displayEligibleWords() {
    eligibleWordsContainer.innerHTML = eligibleWords.join(", ");
    eligibleWordsBox.style.display = "block"; // Ensure the box is visible
}

// Validate if guess exists in the appropriate word list
function isValidGuess(guess) {
    const wordList = wordLength === 5 ? MYWORD5 : wordLength === 6 ? MYWORD6 : MYWORD7;
    return wordList.includes(guess);
}

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

// Add a single keydown event listener to manage both Enter and Backspace
document.addEventListener("keydown", (event) => {
    if (event.key === "Backspace") {
        handleBackspace(event);
    } else if (event.key === "Enter") {
        event.preventDefault();
        submitGuess();
    }
});

// End game after max guesses
function endGame() {
    message.textContent = "Game Over";
}

// Initialize the game board and date heading
setDateHeading();
createRows();
document.querySelector(`.row[data-row-index='0'] .letter-box[data-box-index='0']`).focus();
