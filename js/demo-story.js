/**
 * CampusFind - SIH 2026 Showcase Guided Demo Workflow
 * Provides a 1-click guided presentation story sequence for judges
 */
window.DemoStory = {
    currentStep: 0,
    steps: [
        {
            stepNumber: 1,
            title: "1. Shiva Reports Lost AirPods",
            speakerNote: "Shiva studies in Central Library, misplaces his 2nd Gen AirPods Pro, and logs in to report it with location and time.",
            run() {
                CampusStore.setPersona('shiva');
                App.switchView('report-lost');
                // Pre-fill form fields
                const rollInput = document.getElementById('lost-roll-no');
                const nameInput = document.getElementById('lost-item-name');
                const catInput = document.getElementById('lost-category');
                const locInput = document.getElementById('lost-location');
                const locDetail = document.getElementById('lost-location-detail');
                const descInput = document.getElementById('lost-desc');
                const secretInput = document.getElementById('lost-secret');

                if (rollInput) {
                    rollInput.value = '22K91A0542';
                    rollInput.dispatchEvent(new Event('input'));
                }
                if (nameInput) nameInput.value = 'Apple AirPods Pro (2nd Gen)';
                if (catInput) catInput.value = 'Electronics';
                if (locInput) locInput.value = 'Central Library';
                if (locDetail) locDetail.value = '2nd Floor Quiet Study Zone, Desk #14 near East Window';
                if (descInput) descInput.value = 'White Apple AirPods Pro 2nd Gen case. Left in the study carrel during afternoon study session.';
                if (secretInput) secretInput.value = 'Case has a tiny crescent scratch near charging port. Inside lid says A2698 with blue sticker on right pod.';

                App.showToast('Demo Step 1: Logged in as Shiva (22K91A0542). Lost item form filled with TKRCET details.', 'info');
            }
        },
        {
            stepNumber: 2,
            title: "2. Priya Finds AirPods & Posts",
            speakerNote: "Priya discovers the case on Desk 14, deposits it safely with Librarian Mr. Nair, and posts a Found Report.",
            run() {
                CampusStore.setPersona('priya');
                App.switchView('report-found');
                const rollInput = document.getElementById('found-roll-no');
                const nameInput = document.getElementById('found-item-name');
                const catInput = document.getElementById('found-category');
                const locInput = document.getElementById('found-location');
                const locDetail = document.getElementById('found-location-detail');
                const custodyInput = document.getElementById('found-custody');
                const descInput = document.getElementById('found-desc');
                const secretInput = document.getElementById('found-secret');

                if (rollInput) {
                    rollInput.value = '23K91A0415';
                    rollInput.dispatchEvent(new Event('input'));
                }
                if (nameInput) nameInput.value = 'Apple AirPods Pro Wireless Case';
                if (catInput) catInput.value = 'Electronics';
                if (locInput) locInput.value = 'Central Library';
                if (locDetail) locDetail.value = '2nd Floor Reading Table 14';
                if (custodyInput) custodyInput.value = 'Central Library Helpdesk (Librarian Mr. Nair)';
                if (descInput) descInput.value = 'White wireless earbuds case found sitting on Table 14 after library quiet hours.';
                if (secretInput) secretInput.value = 'Has a tiny crescent scratch on bottom near Lightning/USB-C port and blue marking on right pod stem.';

                App.showToast('Demo Step 2: Logged in as Priya (23K91A0415). Found report prepared with safe custody desk note.', 'success');
            }
        },
        {
            stepNumber: 3,
            title: "3. AI Smart Match Alert (94%)",
            speakerNote: "The platform's matching algorithm detects 94% similarity across category, library location, and name tokens.",
            run() {
                CampusStore.setPersona('shiva');
                App.switchView('dashboard');
                // Highlight the smart match card
                setTimeout(() => {
                    const matchCard = document.getElementById('dashboard-match-banner');
                    if (matchCard) {
                        matchCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        matchCard.classList.add('pulse-highlight');
                        setTimeout(() => matchCard.classList.remove('pulse-highlight'), 3000);
                    }
                }, 200);

                App.showToast('Demo Step 3: AI Smart Match triggered! 94% confidence match displayed on Shiva\'s dashboard.', 'info');
            }
        },
        {
            stepNumber: 4,
            title: "4. Shiva Submits Ownership Claim",
            speakerNote: "Shiva views the found item, where secret marks are hidden, and enters verification answers to prove ownership.",
            run() {
                CampusStore.setPersona('shiva');
                // Open item details for Found AirPods (Item ID 2)
                App.openItemModal(2);
                setTimeout(() => {
                    // Open claim modal
                    App.openClaimModal(2);
                    const rollInput = document.getElementById('claim-roll-no');
                    const proofDesc = document.getElementById('claim-proof-desc');
                    const secretAns = document.getElementById('claim-secret-answers');
                    if (rollInput) {
                        rollInput.value = '22K91A0542';
                        rollInput.dispatchEvent(new Event('input'));
                    }
                    if (proofDesc) {
                        proofDesc.value = 'I lost this yesterday while studying for Operating Systems. Apple invoice available in my Drive.';
                    }
                    if (secretAns) {
                        secretAns.value = 'It has a distinct tiny crescent-shaped scratch right above the Lightning charging port. The right stem also has a faint blue dot marker.';
                    }
                }, 400);

                App.showToast('Demo Step 4: Shiva (22K91A0542) enters anti-fraud distinguishing marks (scratch location & blue marker).', 'info');
            }
        },
        {
            stepNumber: 5,
            title: "5. Admin Reviews & Verifies Claim",
            speakerNote: "Admin opens the Control Center, inspects claimant\'s secret answers against the custody report, and approves.",
            run() {
                CampusStore.setPersona('admin');
                App.closeAllModals();
                App.switchView('admin');
                // Switch to Claims Tab
                setTimeout(() => {
                    App.switchAdminTab('claims');
                    App.showToast('Demo Step 5: Admin compares claimant\'s secret scratch detail with confidential inspection notes.', 'warning');
                }, 200);
            }
        },
        {
            stepNumber: 6,
            title: "6. Handover Complete: Status 'Returned'",
            speakerNote: "Admin issues digital handover pass and marks item as Returned. Campus recovery statistics immediately increment.",
            run() {
                CampusStore.setPersona('admin');
                App.switchView('admin');
                App.switchAdminTab('claims');
                // Verify the claim for AirPods
                const claims = CampusStore.getClaims();
                const airpodsClaim = claims.find(c => c.item_id === 2);
                if (airpodsClaim) {
                    CampusStore.verifyClaim(airpodsClaim.claim_id, 'returned', 'Physical inspection verified at Library Desk. Serial & crescent scratch matched 100%.');
                }
                App.renderAdmin();
                App.renderStats();
                App.showToast('Demo Step 6: Handover verified! Item marked "Returned". Recovery stats +1!', 'success');
            }
        }
    ],

    executeStep(stepNum) {
        this.currentStep = stepNum;
        const target = this.steps.find(s => s.stepNumber === stepNum);
        if (target) {
            target.run();
            this.updatePresenterBar();
        }
    },

    nextStep() {
        if (this.currentStep < this.steps.length) {
            this.executeStep(this.currentStep + 1);
        } else {
            this.executeStep(1);
        }
    },

    resetAll() {
        CampusStore.resetToDefaults();
        CampusStore.setPersona('shiva');
        this.currentStep = 0;
        App.switchView('landing');
        App.renderAll();
        this.updatePresenterBar();
        App.showToast('Demo state reset to clean baseline.', 'info');
    },

    updatePresenterBar() {
        const stepIndicators = document.querySelectorAll('.demo-step-pill');
        stepIndicators.forEach((pill, idx) => {
            const num = idx + 1;
            if (num === this.currentStep) {
                pill.classList.add('active');
            } else if (num < this.currentStep) {
                pill.classList.add('completed');
                pill.classList.remove('active');
            } else {
                pill.classList.remove('active', 'completed');
            }
        });

        const noteEl = document.getElementById('demo-speaker-note');
        if (noteEl && this.currentStep > 0 && this.steps[this.currentStep - 1]) {
            noteEl.innerHTML = `<strong>${this.steps[this.currentStep - 1].title}:</strong> ${this.steps[this.currentStep - 1].speakerNote}`;
        } else if (noteEl) {
            noteEl.innerHTML = `<strong>SIH 2026 Presentation Story:</strong> Click Step 1 or "Start Guided Story" to demonstrate the complete Lost ➔ Match ➔ Verify ➔ Recover cycle.`;
        }
    }
};
