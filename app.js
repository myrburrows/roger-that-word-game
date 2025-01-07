import { COMMONWORDS } from './data/commonwords.js';
import { MYWORD5 } from './data/myword5.js';
import { MYWORD6 } from './data/myword6.js';
import { MYWORD7 } from './data/myword7.js';

const gameBoard = document.getElementById("game-board");
const message = document.getElementById("message");
const eligibleWordsBox = document.getElementById("eligible-words-box");
const eligibleWordsContainer = document.getElementById("eligible-words");
const shareBtn = document.getElementById("share-btn"); // Reference the Share button

fetch('https://roger-that-bridge-flashcards-5bffcbb5d89a.herokuapp.com/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_name: 'roger-that-word-game' })
});

let currentRow = 0;
let currentBox = 0;
let guessCount = 0; // Track the number of guesses
let solved = false; // Track whether the game is solved

// Toggle this flag to enable/disable test mode
const testMode = false; // Set to `false` for production

// Get today's word based on date offset or a random word in test mode
function getDailyWord() {
    let dailyWord; // Declare the dailyWord variable

    if (testMode) {
        // Test mode: Return a random word from COMMONWORDS
        const randomIndex = Math.floor(Math.random() * COMMONWORDS.length);
        dailyWord = COMMONWORDS[randomIndex];
    } else {
        // Production mode: Calculate today's word based on date
        const startDate = new Date(2024, 9, 30); // October 30, 2024 (0-indexed month)
        const today = new Date();
        const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        const wordIndex = daysSinceStart % COMMONWORDS.length;
        dailyWord = COMMONWORDS[wordIndex];
    }

    return dailyWord; // Return the selected word
}

const dailyWord = getDailyWord();
const wordLength = dailyWord.length;
let eligibleWords = Array.from(wordLength === 5 ? MYWORD5 : wordLength === 6 ? MYWORD6 : MYWORD7);

// Ensure Eligible Words box contents are hidden initially
eligibleWordsContainer.style.display = "none";

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
    const guess = Array.from(row.children)
                       .map(box => box.textContent.trim().toLowerCase())
                       .join("");

    if (guess.length === wordLength && isValidGuess(guess)) {
        guessCount++;
        checkGuess(guess);
        
        // Mark the letters in this guess as used
        markLettersAsUsed(guess);

        if (guess === dailyWord) {
            solved = true;
            endGame();
            return;
        }

        currentRow++;
        currentBox = 0;

        // Filter eligible words
        updateEligibleWords(guess);

        // Display eligible words after 2 guesses
        if (guessCount > 2) {
            displayEligibleWords();
        }

        if (currentRow >= 4) {
            endGame();
        } else {
            const nextRowFirstBox = document.querySelector(
              `.row[data-row-index='${currentRow}'] .letter-box[data-box-index='0']`
            );
            nextRowFirstBox.focus();
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
    eligibleWordsBox.style.display = "block"; // Ensure the box is visible
    eligibleWordsContainer.style.display = "block"; // Make contents visible
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
    const gameDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });
    const status = solved
        ? `Solved in ${guessCount} tries!`
        : "Couldn't solve today's word.";
    const shareMessage = `Roger That Word Game | ${gameDate} | ${status}`;

    // Display game over message
    message.textContent = "Game Over";

    // Show the Share button
    shareBtn.style.display = "block";
    shareBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(shareMessage).then(() => {
            alert("Copied to clipboard: " + shareMessage);
        }).catch(err => {
            console.error("Failed to copy text: ", err);
        });
    });
}

function markLettersAsUsed(guess) {
    const guessLetters = guess.toUpperCase().split("");
    const dailyUpper = dailyWord.toUpperCase();

    guessLetters.forEach(letter => {
        const letterElem = document.querySelector(`.letter-display[data-letter="${letter}"]`);
        if (letterElem) {
            if (dailyUpper.includes(letter)) {
                // Letter is in the dailyWord, highlight it
                letterElem.classList.add("highlighted");
                letterElem.classList.remove("greyed-out");
            } else {
                // Letter is NOT in the dailyWord, gray it out
                letterElem.classList.add("greyed-out");
                letterElem.classList.remove("highlighted");
            }
        }
    });
}

// Initialize the game board and date heading
setDateHeading();
createRows();
document.querySelector(`.row[data-row-index='0'] .letter-box[data-box-index='0']`).focus();
