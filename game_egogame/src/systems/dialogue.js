// systems/dialogue.js

export class DialogueManager {
    constructor() {
        this.isOpen = false;
        this.currentNPC = null;
        this.currentDialogue = [];
        this.currentSentenceIndex = 0;
        this.onDialogueEnd = null; // Callback function when dialogue ends
    }

    startDialogue(npc, onDialogueEndCallback) {
        this.isOpen = true;
        this.currentNPC = npc;
        this.currentDialogue = npc.dialogue;
        this.currentSentenceIndex = 0;
        this.onDialogueEnd = onDialogueEndCallback;
        console.log(`Starting dialogue with ${npc.name}: ${this.currentDialogue[this.currentSentenceIndex]}`);
    }

    nextSentence() {
        if (!this.isOpen) return;

        this.currentSentenceIndex++;
        if (this.currentSentenceIndex < this.currentDialogue.length) {
            console.log(`Next sentence: ${this.currentDialogue[this.currentSentenceIndex]}`);
        } else {
            this.endDialogue();
        }
    }

    endDialogue() {
        this.isOpen = false;
        console.log('Dialogue ended.');
        if (this.onDialogueEnd) {
            this.onDialogueEnd(this.currentNPC);
        }
        this.currentNPC = null;
        this.currentDialogue = [];
        this.currentSentenceIndex = 0;
        this.onDialogueEnd = null;
    }

    getCurrentDialogue() {
        if (this.isOpen && this.currentNPC) {
            return {
                name: this.currentNPC.name,
                sentence: this.currentDialogue[this.currentSentenceIndex],
                hasNext: this.currentSentenceIndex < this.currentDialogue.length - 1,
            };
        }
        return null;
    }
}
