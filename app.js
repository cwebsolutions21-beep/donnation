/* ==========================================================================
   Sri Lakshmi Ganapathi Temple - Core Application JS
   ========================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyCwEmH0AQihz996cCp4YlV4FmNWJdjYyf0",
  authDomain: "payment-2d3d6.firebaseapp.com",
  projectId: "payment-2d3d6",
  storageBucket: "payment-2d3d6.firebasestorage.app",
  messagingSenderId: "309714344515",
  appId: "1:309714344515:web:f6fc1b647993fe4c4312f6"
};

const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------------------------------
    // 1. Initial State & Configuration Defaults
    // ---------------------------------------------------------
    const CONFIG_KEY = 'temple_upi_config';
    const DONATIONS_KEY = 'temple_donations';

    const defaultConfig = {
        upiId: 'BHARATPE2I0H0L6P0U22806@unitype', // User's BharatPe merchant UPI ID
        payeeName: 'Sri Lakshmi Ganapathi Temple',
        reasonNote: '7th Anniv Anna Samaradhana',
        adminPin: '1234',
        editorPin: '4321', // Default editor passcode
        theme: 'green', // Default theme color
        eventDate: '25-06-2026 (గురువారం)',
        eventTime: 'ఉదయం 11:00 గంటల నుండి',
        eventTitle: '7వ వార్షికోత్సవం మరియు అన్నసమారాధన మహోత్సవం',
        templeTitle: 'శ్రీ లక్ష్మీ గణపతి ఆలయం',
        templeSubtitle: 'సూర్య బలిజ సంఘం — ఇరగవరం',
        eventHeader: 'అన్న సమారాధన',
        eventDesc: 'శ్రీ లక్ష్మీ గణపతి ఆలయ 7వ వార్షికోత్సవం మరియు అన్న సమారాధన మహోత్సవమునకు భక్తులందరికీ ఆత్మీయ ఆహ్వానం!\n\nసూర్య బలిజ సంఘం (ఇరగవరం) ఆధ్వర్యంలో ఏర్పాటు చేసిన ఈ పవిత్ర అన్నదాన కార్యక్రమానికి మీ వంతు విరాళాలు అందించి, స్వామి వారి కృపకు పాత్రులు కాగలరని ప్రార్థన.',
        flyerImage: null,
        contactDetails: '9848022312, 7013894220'
    };

    // Load configs from Firestore in real-time
    let config = { ...defaultConfig };
    db.collection("temple").doc("config").onSnapshot(
        (docSnap) => {
            if (docSnap.exists) {
                config = docSnap.data();
                // Proactively migrate Firestore config if it contains the old PhonePe VPA
                if (config.upiId === '8499960979@ybl') {
                    config.upiId = 'BHARATPE2I0H0L6P0U22806@unitype';
                    db.collection("temple").doc("config").update({ upiId: 'BHARATPE2I0H0L6P0U22806@unitype' }).catch(e => {
                        console.log("Firestore auto-update migration skipped/handled:", e);
                    });
                }
                applyConfigToDOM();
            } else {
                // Seed defaults to Cloud Firestore
                db.collection("temple").doc("config").set(defaultConfig).catch(err => {
                    console.error("Firebase write error (seeding config):", err);
                });
            }
        },
        (error) => {
            console.error("Firestore config subscription error:", error);
            if (error.code === 'permission-denied') {
                alert("Firebase Access Denied: Your Firestore security rules are blocking reads. Please update your rules in the Firebase Console to allow public access.");
            }
        }
    );

    function applyConfigToDOM() {
        const dateDisplay = document.getElementById('event-date-display');
        const timeDisplay = document.getElementById('event-time-display');
        const titleDisplay = document.getElementById('event-title-display');
        const templeTitleDisplay = document.getElementById('main-temple-title');
        const templeSubtitleDisplay = document.getElementById('main-temple-subtitle');
        const eventHeaderDisplay = document.getElementById('main-event-header');
        const eventDescDisplay = document.getElementById('main-event-desc');
        const mainFlyerImg = document.getElementById('main-flyer-img');
        const contactDisplay = document.getElementById('event-contact-display');

        if (dateDisplay && config.eventDate) dateDisplay.textContent = config.eventDate;
        if (timeDisplay && config.eventTime) timeDisplay.textContent = config.eventTime;
        if (titleDisplay && config.eventTitle) titleDisplay.textContent = config.eventTitle;
        
        if (templeTitleDisplay && config.templeTitle) templeTitleDisplay.textContent = config.templeTitle;
        if (templeSubtitleDisplay && config.templeSubtitle) templeSubtitleDisplay.textContent = config.templeSubtitle;
        if (eventHeaderDisplay && config.eventHeader) eventHeaderDisplay.textContent = config.eventHeader;
        if (eventDescDisplay && config.eventDesc) {
            eventDescDisplay.innerHTML = config.eventDesc.replace(/\n/g, '<br>');
        }
        
        if (mainFlyerImg && config.flyerImage) {
            mainFlyerImg.src = config.flyerImage;
        }
        
        if (contactDisplay && config.contactDetails) {
            contactDisplay.textContent = config.contactDetails;
        }

        applyTheme(config.theme || 'green');
    }

    function hexToHSL(hex) {
        hex = hex.replace(/^#/, '');
        let r = parseInt(hex.substring(0, 2), 16) / 255;
        let g = parseInt(hex.substring(2, 4), 16) / 255;
        let b = parseInt(hex.substring(4, 6), 16) / 255;
        let max = Math.max(r, g, b);
        let min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) {
            h = s = 0;
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        h = Math.round(h * 360);
        s = Math.round(s * 100);
        l = Math.round(l * 100);
        return { h, s, l };
    }

    function applyTheme(themeValue) {
        const root = document.documentElement;
        if (themeValue.startsWith('#')) {
            const hsl = hexToHSL(themeValue);
            root.style.setProperty('--bg-gradient', `linear-gradient(135deg, hsl(${hsl.h}, ${hsl.s}%, 4%) 0%, hsl(${hsl.h}, ${hsl.s}%, 10%) 40%, hsl(${hsl.h}, ${hsl.s}%, 2%) 100%)`);
            root.style.setProperty('--text-muted', `hsl(${hsl.h}, ${hsl.s}%, 85%)`);
            return;
        }
        if (themeValue === 'saffron') {
            root.style.setProperty('--bg-gradient', 'linear-gradient(135deg, #1f0802 0%, #471304 40%, #170400 100%)');
            root.style.setProperty('--text-muted', '#fcebe6');
        } else if (themeValue === 'blue') {
            root.style.setProperty('--bg-gradient', 'linear-gradient(135deg, #020b1c 0%, #051c47 40%, #010612 100%)');
            root.style.setProperty('--text-muted', '#e6ecfc');
        } else if (themeValue === 'purple') {
            root.style.setProperty('--bg-gradient', 'linear-gradient(135deg, #10021c 0%, #290547 40%, #08010f 100%)');
            root.style.setProperty('--text-muted', '#f5e6fc');
        } else { // green
            root.style.setProperty('--bg-gradient', 'linear-gradient(135deg, #041a07 0%, #0c3813 40%, #020f04 100%)');
            root.style.setProperty('--text-muted', '#d4ebd8');
        }
    }

    // Load or initialize donations log
    let donations = [
        { name: 'K. Ramalingam', phone: '9848022312', amount: 501, date: '2026-05-28 10:15 AM', status: 'Verified', txnId: 'TXN639201584' },
        { name: 'M. Durga Prasad', phone: '7013894220', amount: 1001, date: '2026-05-30 04:30 PM', status: 'Verified', txnId: 'TXN639201659' },
        { name: 'Surya Balija Members', phone: '8499912000', amount: 5001, date: '2026-06-01 09:12 AM', status: 'Verified', txnId: 'TXN639201992' }
    ];
    db.collection("temple").doc("donations").onSnapshot(
        (docSnap) => {
            if (docSnap.exists) {
                donations = docSnap.data().list || [];
                updateDashboardStats();
                // Render table inside Management access panel if active
                const pageAdmin = document.getElementById('page-admin');
                if (pageAdmin && pageAdmin.classList.contains('active')) {
                    renderTransactionsTable();
                }
            } else {
                // Seed defaults to Cloud Firestore
                db.collection("temple").doc("donations").set({ list: donations }).catch(err => {
                    console.error("Firebase write error (seeding donations):", err);
                });
            }
        },
        (error) => {
            console.error("Firestore donations subscription error:", error);
            if (error.code === 'permission-denied') {
                alert("Firebase Access Denied: Your Firestore security rules are blocking reads. Please update your rules in the Firebase Console to allow public access.");
            }
        }
    );

    // Live Stats Updates
    updateDashboardStats();

    // ---------------------------------------------------------
    // 2. DOM Selectors
    // ---------------------------------------------------------
    const donateBtn = document.getElementById('btn-donate-trigger');
    const donateModal = document.getElementById('donate-modal');
    const modalCloseBtn = document.getElementById('modal-close');
    
    // Modal Pages
    const pageForm = document.getElementById('page-form');
    const pagePay = document.getElementById('page-pay');   // hidden alias
    const pageVerify = document.getElementById('page-verify');
    const pageSuccess = document.getElementById('page-success');
    const pageAdmin = document.getElementById('page-admin');
    const pageEditor = document.getElementById('page-editor');
    const modalPages = [pageForm, pagePay, pageVerify, pageSuccess, pageAdmin, pageEditor];

    // Form inputs (all on the single combined page)
    const inputName = document.getElementById('donor-name');
    const inputPhone = document.getElementById('donor-phone');
    const inputAmount = document.getElementById('donor-amount');
    const amountChips = document.querySelectorAll('.chip[data-amount]');

    // QR & Mobile Payment elements
    const qrImage = document.getElementById('qr-code-img');
    const phonepeLink = document.getElementById('phonepe-direct-link');
    const gpayLink = document.getElementById('gpay-direct-link');
    const paytmLink = document.getElementById('paytm-direct-link');
    const genericLink = document.getElementById('generic-direct-link');
    // Summary spans (hidden, kept for JS compat)
    const summaryName = document.getElementById('summary-name');
    const summaryPhone = document.getElementById('summary-phone');
    const summaryAmount = document.getElementById('summary-amount');
    const simulatedVerificationBtn = document.getElementById('btn-simulated-verify');

    // Verification View progress
    let verificationInterval = null;
    let activeTxnId = null; // Pre-generated unique reference for P2M reconciliation
    const progressFill = document.getElementById('progress-fill');
    const statusText = document.getElementById('status-text');
    const btnVerifyBack = document.getElementById('btn-verify-back');

    // Success Invoice elements
    const receiptName = document.getElementById('receipt-name');
    const receiptPhone = document.getElementById('receipt-phone');
    const receiptAmount = document.getElementById('receipt-amount');
    const receiptTxn = document.getElementById('receipt-txn');
    const receiptDate = document.getElementById('receipt-date');
    const btnSuccessClose = document.getElementById('btn-success-close');

    // Admin/Management dashboard selectors
    const adminLink = document.getElementById('admin-trigger-link');
    const adminForm = document.getElementById('admin-form');
    const adminInputUpi = document.getElementById('admin-upi');
    const adminInputName = document.getElementById('admin-payee');
    const adminInputNote = document.getElementById('admin-note');
    const adminInputPin = document.getElementById('admin-pin');
    const adminInputEditorPin = document.getElementById('admin-editor-pin');
    const adminTableBody = document.getElementById('admin-table-body');
    const btnExportCsv = document.getElementById('btn-export-csv');
    const btnClearDonors = document.getElementById('btn-clear-donors');

    // Editor dashboard selectors
    const editorLink = document.getElementById('editor-trigger-link');
    const editorForm = document.getElementById('editor-form');
    const editorInputTempleTitle = document.getElementById('editor-temple-title');
    const editorInputTempleSubtitle = document.getElementById('editor-temple-subtitle');
    const editorInputEventHeader = document.getElementById('editor-event-header');
    const editorInputEventTitle = document.getElementById('editor-event-title');
    const editorInputEventDesc = document.getElementById('editor-event-desc');
    const editorInputEventDate = document.getElementById('editor-event-date');
    const editorInputEventTime = document.getElementById('editor-event-time');
    const editorInputTheme = document.getElementById('editor-theme');
    const editorInputFlyerFile = document.getElementById('editor-flyer-file');

    // ---------------------------------------------------------
    // 3. Responsive Agent & Mobile Setup
    // ---------------------------------------------------------
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        document.body.classList.add('mobile-device');
    }

    // ---------------------------------------------------------
    // 4. Modal Flow Operations
    // ---------------------------------------------------------
    function showModal() {
        donateModal.classList.add('active');
        switchModalPage(pageForm);
        // Reset all inputs to blank
        inputName.value = '';
        inputPhone.value = '';
        inputAmount.value = '';
        amountChips.forEach(c => c.classList.remove('active'));
        // Reset QR: hide img, show placeholder
        if (qrImage) { qrImage.style.display = 'none'; qrImage.src = ''; }
        const qrPlaceholder = document.getElementById('qr-placeholder');
        if (qrPlaceholder) qrPlaceholder.style.display = 'flex';
        activeTxnId = 'TXN' + Math.floor(100000000 + Math.random() * 900000000);
    }

    function closeModal() {
        donateModal.classList.remove('active');
        // Revert to saved theme if they closed the editor panel without saving
        applyTheme(config.theme || 'green');
        setTimeout(() => {
            switchModalPage(pageForm);
        }, 300);
    }

    function switchModalPage(targetPage) {
        modalPages.forEach(p => p.classList.remove('active'));
        targetPage.classList.add('active');

        const modalContent = donateModal.querySelector('.modal-content');
        if (modalContent) {
            if (targetPage === pageAdmin) {
                modalContent.classList.add('admin-active');
                modalContent.classList.remove('editor-active');
                modalContent.classList.remove('pay-active');
            } else if (targetPage === pageEditor) {
                modalContent.classList.add('editor-active');
                modalContent.classList.remove('admin-active');
                modalContent.classList.remove('pay-active');
            } else if (targetPage === pagePay) {
                modalContent.classList.add('pay-active');
                modalContent.classList.remove('admin-active');
                modalContent.classList.remove('editor-active');
            } else {
                modalContent.classList.remove('admin-active');
                modalContent.classList.remove('editor-active');
                modalContent.classList.remove('pay-active');
            }
        }
    }

    donateBtn.addEventListener('click', showModal);
    modalCloseBtn.addEventListener('click', closeModal);

    // Click outside to close modal
    donateModal.addEventListener('click', (e) => {
        if (e.target === donateModal) {
            closeModal();
        }
    });

    // ---------------------------------------------------------
    // 5. Donation Form Logic (Chips & Live QR/Link Updates)
    // ---------------------------------------------------------

    // Live update function: regenerates QR + UPI links whenever amount changes
    function updateLivePaymentUI(amount) {
        if (!amount || amount <= 0) return;
        const qrUpiLink = buildQrUpiUri(amount);
        const encodedQrUpi = encodeURIComponent(qrUpiLink);
        // Show QR image, hide placeholder
        const qrPlaceholder = document.getElementById('qr-placeholder');
        if (qrPlaceholder) qrPlaceholder.style.display = 'none';
        qrImage.style.display = 'block';
        qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodedQrUpi}&color=120202`;
        if (phonepeLink) phonepeLink.href = buildAppUpiUri('phonepe', amount);
        if (gpayLink) gpayLink.href = buildAppUpiUri('gpay', amount);
        if (paytmLink) paytmLink.href = buildAppUpiUri('paytm', amount);
        if (genericLink) genericLink.href = buildAppUpiUri('upi', amount);
    }

    amountChips.forEach(chip => {
        chip.addEventListener('click', () => {
            amountChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            inputAmount.value = chip.dataset.amount;
            updateLivePaymentUI(parseFloat(chip.dataset.amount));
        });
    });

    inputAmount.addEventListener('input', () => {
        const enteredVal = parseFloat(inputAmount.value);
        amountChips.forEach(chip => {
            if (parseFloat(chip.dataset.amount) === enteredVal) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });
        if (!isNaN(enteredVal) && enteredVal > 0) {
            updateLivePaymentUI(enteredVal);
        }
    });

    // Generate highly-compatible UPI URI for general app links (essential for merchant accounts like BharatPe)
    function buildAppUpiUri(scheme, amount) {
        const u = config.upiId.trim();
        const am = amount.toFixed(2);
        
        const params = `pa=${u}&pn=Donation&am=${am}&cu=INR`;
        
        if (scheme === 'phonepe') {
            return `phonepe://pay?${params}`;
        } else if (scheme === 'gpay') {
            return `gpay://upi/pay?${params}`;
        } else if (scheme === 'paytm') {
            return `paytmmp://pay?${params}`;
        } else {
            return `upi://pay?${params}`;
        }
    }

    // Generate highly-compatible unencoded UPI URI for QR codes (essential for merchant accounts like BharatPe)
    function buildQrUpiUri(amount) {
        const u = config.upiId.trim();
        const am = amount.toFixed(2);
        return `upi://pay?pa=${u}&pn=Donation&am=${am}&cu=INR`;
    }

    // ---------------------------------------------------------
    // 6. Payment Confirmation Handlers
    // ---------------------------------------------------------
    // UPI app buttons:
    // - Mobile: launches the app. User pays, returns, then clicks "I Have Completed Payment".
    // - Desktop: deep links don't work, show a friendly QR reminder toast instead.
    // UPI app buttons:
    // - Mobile: launches the app. User pays, returns, then clicks "I Have Completed Payment".
    // - Desktop: deep links don't work, show a friendly QR reminder toast instead.
    const upiAppButtons = [
        { element: phonepeLink, scheme: 'phonepe' },
        { element: gpayLink, scheme: 'gpay' },
        { element: paytmLink, scheme: 'paytm' },
        { element: genericLink, scheme: 'upi' }
    ];

    upiAppButtons.forEach(btn => {
        if (btn.element) {
            btn.element.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent standard page jumping or '#' link behavior
                
                // 1. Get and validate amount
                const amount = parseFloat(inputAmount.value);
                if (isNaN(amount) || amount <= 0) {
                    showValidationToast('దయచేసి ముందుగా మొత్తం ఎంచుకోండి (Please select or enter an amount first!)');
                    
                    // Add shake highlight to quick donate container
                    const quickSection = document.querySelector('.quick-donate-section');
                    if (quickSection) {
                        quickSection.classList.add('shake-highlight');
                        setTimeout(() => quickSection.classList.remove('shake-highlight'), 500);
                    }
                    inputAmount.focus();
                    return;
                }

                // 2. On desktop, deep links don't work, show QR code scanner nudge
                if (!isMobile) {
                    showQrToast();
                    return;
                }

                // 3. Generate precise deep link based on OS and targeted app
                const deepLink = getPreciseMobileUpiDeepLink(btn.scheme, amount);
                
                // 4. Navigate to deep link to open the app directly
                window.location.href = deepLink;
            });
        }
    });

    // Helper to generate exact Direct-Launch UPI Deep Link matching standard specifications
    function getPreciseMobileUpiDeepLink(scheme, amount) {
        const u = config.upiId.trim();
        const am = amount.toFixed(2);
        
        const isAndroidDevice = /Android/i.test(navigator.userAgent);
        const isIOSDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        // Base standard UPI parameters with pn=Donation
        const params = `pa=${u}&pn=Donation&am=${am}&cu=INR`;
        
        if (isAndroidDevice) {
            // Android package-specific Intents bypasses the generic chooser for instant launch
            if (scheme === 'phonepe') {
                return `intent://pay?${params}#Intent;scheme=upi;package=com.phonepe.app;end`;
            } else if (scheme === 'gpay') {
                return `intent://pay?${params}#Intent;scheme=upi;package=com.google.android.apps.nativetix;end`;
            } else if (scheme === 'paytm') {
                return `intent://pay?${params}#Intent;scheme=upi;package=net.one97.paytm;end`;
            } else {
                return `intent://pay?${params}#Intent;scheme=upi;end`;
            }
        } else if (isIOSDevice) {
            // iOS custom URL schemes mapped specifically to registered app targets
            if (scheme === 'phonepe') {
                return `phonepe://upi/pay?${params}`;
            } else if (scheme === 'gpay') {
                return `tez://upi/pay?${params}`;
            } else if (scheme === 'paytm') {
                return `paytmmp://pay?${params}`;
            } else {
                return `upi://pay?${params}`;
            }
        } else {
            // Fallback generic format
            if (scheme === 'phonepe') {
                return `phonepe://pay?${params}`;
            } else if (scheme === 'gpay') {
                return `gpay://upi/pay?${params}`;
            } else if (scheme === 'paytm') {
                return `paytmmp://pay?${params}`;
            } else {
                return `upi://pay?${params}`;
            }
        }
    }

    // Beautiful warning toast matching the premium dashboard theme
    function showValidationToast(message) {
        const existing = document.getElementById('validation-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'validation-toast';
        toast.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation" style="font-size:1.2rem; color: #ffb300;"></i>
            <div>
                <span style="font-size:0.85rem; font-weight:600; color: #ffebee;">${message}</span>
            </div>
            <button onclick="this.parentNode.remove()" style="background:none; border:none; color:rgba(255,255,255,0.6); font-size:1.1rem; cursor:pointer; line-height:1; padding: 0 0 0 0.5rem;">✕</button>
        `;
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(30, 20, 10, 0.95);
            border: 1.5px solid #ffb300;
            border-radius: 14px;
            padding: 0.9rem 1.25rem;
            display: flex;
            align-items: center;
            gap: 0.85rem;
            box-shadow: 0 8px 30px rgba(0,0,0,0.8), 0 0 20px rgba(255,179,0,0.15);
            z-index: 9999;
            max-width: 420px;
            width: 90vw;
            backdrop-filter: blur(8px);
            animation: toastSlideUp 0.3s cubic-bezier(0.175,0.885,0.32,1.275);
        `;
        document.body.appendChild(toast);
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 5000);
    }

    // Toast notification: nudge desktop users to scan the QR code
    function showQrToast() {
        // Remove any existing toast
        const existing = document.getElementById('qr-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'qr-toast';
        toast.innerHTML = `
            <i class="fa-solid fa-qrcode" style="font-size:1.3rem; color: var(--gold-secondary);"></i>
            <div>
                <strong style="display:block; font-size:0.9rem; color: var(--gold-light);">డెస్క్‌టాప్‌లో QR కోడ్ స్కాన్ చేయండి</strong>
                <span style="font-size:0.78rem; color: var(--text-muted);">UPI apps don't open on desktop. Please scan the QR code with your phone to pay.</span>
            </div>
            <button onclick="document.getElementById('qr-toast').remove()" style="background:none; border:none; color:var(--text-muted); font-size:1.1rem; cursor:pointer; line-height:1;">✕</button>
        `;
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #0d3b14 0%, #031405 100%);
            border: 1.5px solid var(--gold-primary);
            border-radius: 14px;
            padding: 1rem 1.25rem;
            display: flex;
            align-items: center;
            gap: 0.85rem;
            box-shadow: 0 8px 30px rgba(0,0,0,0.7), 0 0 20px rgba(223,162,34,0.2);
            z-index: 9999;
            max-width: 420px;
            width: 90vw;
            animation: toastSlideUp 0.3s cubic-bezier(0.175,0.885,0.32,1.275);
        `;
        document.body.appendChild(toast);

        // Auto-dismiss after 5 seconds
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 5000);
    }

    // "I Have Completed Payment" button → validate then finalize
    simulatedVerificationBtn.addEventListener('click', () => {
        const donorName = inputName.value.trim();
        const donorPhone = inputPhone.value.trim();
        const donorAmount = parseFloat(inputAmount.value);

        if (!donorName) {
            inputName.focus();
            inputName.style.borderColor = '#f44336';
            setTimeout(() => inputName.style.borderColor = '', 2000);
            alert('దయచేసి మీ పేరు నమోదు చేయండి (Please enter your name)');
            return;
        }
        if (!donorPhone || !/^[6-9][0-9]{9}$/.test(donorPhone)) {
            inputPhone.focus();
            inputPhone.style.borderColor = '#f44336';
            setTimeout(() => inputPhone.style.borderColor = '', 2000);
            alert('దయచేసి సరైన 10 అంకెల ఫోన్ నెంబర్ నమోదు చేయండి (Please enter a valid 10-digit phone number)');
            return;
        }
        if (isNaN(donorAmount) || donorAmount <= 0) {
            inputAmount.focus();
            inputAmount.style.borderColor = '#f44336';
            setTimeout(() => inputAmount.style.borderColor = '', 2000);
            alert('దయచేసి విరాళం మొత్తం నమోదు చేయండి (Please enter a donation amount)');
            return;
        }

        finalizeTransaction();
    });

    // Finalize: Save transaction & display custom receipt with confetti!
    function finalizeTransaction() {
        const donorName = inputName.value.trim();
        const donorPhone = inputPhone.value.trim();
        const donorAmount = parseFloat(inputAmount.value);
        
        const timestamp = getFormattedTimestamp();
        const transactionId = activeTxnId || ('TXN' + Math.floor(100000000 + Math.random() * 900000000));

        const transactionRecord = {
            name: donorName,
            phone: donorPhone,
            amount: donorAmount,
            date: timestamp,
            status: 'Awaiting Verification',
            txnId: transactionId
        };

        const updatedDonations = [transactionRecord, ...donations];

        db.collection("temple").doc("donations").set({ list: updatedDonations })
            .then(() => {
                // Populate receipt view
                receiptName.textContent = donorName;
                receiptPhone.textContent = donorPhone;
                receiptAmount.textContent = `₹${donorAmount.toLocaleString('en-IN')}.00`;
                receiptTxn.textContent = transactionId;
                receiptDate.textContent = timestamp;
                const receiptStatus = document.getElementById('receipt-status');
                if (receiptStatus) {
                    receiptStatus.textContent = 'పరిశీలనలో ఉంది (Awaiting Bank Verification)';
                    receiptStatus.style.color = 'var(--gold-secondary)';
                }
                switchModalPage(pageSuccess);
                startConfetti();
            })
            .catch(err => {
                console.error("Firebase write error:", err);
                alert("Error saving details to cloud: " + err.message + "\n\nPlease check your Firestore security rules in your Firebase Console!");
                switchModalPage(pageForm);
            });
    }

    btnSuccessClose.addEventListener('click', closeModal);

    // ---------------------------------------------------------
    // 7. Admin & Editor Settings & Dashboards
    // ---------------------------------------------------------
    
    // MANAGEMENT (ADMIN) ROLE
    adminLink.addEventListener('click', (e) => {
        e.preventDefault();
        
        const enteredPin = prompt('Enter passcode to access Management Panel:');
        if (enteredPin === config.adminPin) {
            openAdminPanel();
        } else if (enteredPin !== null) {
            alert('Incorrect passcode. Access Denied!');
        }
    });

    function openAdminPanel() {
        // Pre-fill fields with current payment settings
        adminInputUpi.value = config.upiId;
        adminInputName.value = config.payeeName;
        adminInputNote.value = config.reasonNote;
        adminInputPin.value = config.adminPin;
        adminInputEditorPin.value = config.editorPin || '4321';

        // Render transactions list
        renderTransactionsTable();

        showModal();
        switchModalPage(pageAdmin);
    }

    // Save admin settings changes
    adminForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const upiIdVal = adminInputUpi.value.trim();
        const payeeNameVal = adminInputName.value.trim();
        const reasonNoteVal = adminInputNote.value.trim();
        const adminPinVal = adminInputPin.value.trim();
        const editorPinVal = adminInputEditorPin.value.trim();

        // 1. Strict validation of UPI ID
        if (!upiIdVal.includes('@') || /\s/.test(upiIdVal) || /%/.test(upiIdVal)) {
            alert("Error: Please enter a valid UPI ID (e.g., name@upi) with no spaces or special symbols.");
            return;
        }

        // 2. Warn if non-ASCII regional characters (Telugu, Hindi, emojis, etc.) are used in fields that build the QR
        const nonAsciiRegex = /[^\x00-\x7F]/;
        if (nonAsciiRegex.test(payeeNameVal) || nonAsciiRegex.test(reasonNoteVal)) {
            const confirmSave = confirm("Warning: The Payee Name or Transaction Note contains regional languages (such as Telugu/Hindi) or special characters.\n\nUPI scanners on standard payment apps (GPay, PhonePe, Paytm) generally do not support regional characters in payment URLs and may fail to scan the QR code completely.\n\nWe highly recommend using only standard English alphanumeric characters for these two fields.\n\nDo you still want to save these settings?");
            if (!confirmSave) return;
        }

        config.upiId = upiIdVal;
        config.payeeName = payeeNameVal;
        config.reasonNote = reasonNoteVal;
        config.adminPin = adminPinVal;
        config.editorPin = editorPinVal;

        db.collection("temple").doc("config").set(config).then(() => {
            alert('Payment settings saved successfully!');
            closeModal();
        }).catch(err => {
            console.error("Firebase write error:", err);
            alert("Error saving settings. Please check your Firebase Database Rules.");
        });
    });

    // EDITOR ROLE
    editorLink.addEventListener('click', (e) => {
        e.preventDefault();
        
        const enteredPin = prompt('ఎడిటర్ ప్యానెల్ యాక్సెస్ చేయడానికి పాస్‌కోడ్ నమోదు చేయండి:');
        if (enteredPin === config.editorPin) {
            openEditorPanel();
        } else if (enteredPin !== null) {
            alert('తప్పుడు పాస్‌కోడ్. ప్రవేశం నిరాకరించబడింది!');
        }
    });

    function openEditorPanel() {
        // Pre-fill fields with current content settings
        editorInputTempleTitle.value = config.templeTitle || 'శ్రీ లక్ష్మీ గణపతి ఆలయం';
        editorInputTempleSubtitle.value = config.templeSubtitle || 'సూర్య బలిజ సంఘం — ఇరగవరం';
        editorInputEventHeader.value = config.eventHeader || 'అన్న సమారాధన';
        editorInputEventTitle.value = config.eventTitle || '7వ వార్షికోత్సవం మరియు అన్నసమారాధన మహోత్సవం';
        editorInputEventDesc.value = config.eventDesc || '';
        editorInputEventDate.value = config.eventDate || '25-06-2026 (గురువారం)';
        editorInputEventTime.value = config.eventTime || 'ఉదయం 11:00 గంటల నుండి';
        editorInputTheme.value = config.theme || '#0c3813';
        editorInputFlyerFile.value = ''; // Reset file input

        const editorInputContact = document.getElementById('editor-contact');
        if (editorInputContact) {
            editorInputContact.value = config.contactDetails || '';
        }

        // Initialize Selection Visuals
        let activeColor = config.theme || '#0c3813';
        if (activeColor === 'green') activeColor = '#0c3813';
        else if (activeColor === 'saffron') activeColor = '#b21f1f';
        else if (activeColor === 'blue') activeColor = '#051c47';
        else if (activeColor === 'purple') activeColor = '#290547';

        const isPreset = ['#0c3813', '#b21f1f', '#051c47', '#290547', '#b87b0c', '#004d40', '#4a0007'].includes(activeColor.toLowerCase());
        selectColor(activeColor, !isPreset);

        showModal();
        switchModalPage(pageEditor);
    }

    // Custom Color Bar Controller Functions
    function selectColor(colorHex, isCustom = false) {
        const colorChips = document.querySelectorAll('.color-chip');
        const editorThemePicker = document.getElementById('editor-theme-picker');
        const customColorBtn = document.getElementById('custom-color-btn');

        // Update hidden input value
        editorInputTheme.value = colorHex;
        
        // Remove active state from all chips
        colorChips.forEach(chip => {
            chip.classList.remove('active');
            chip.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            chip.style.transform = 'scale(1)';
            chip.style.boxShadow = 'none';
        });

        if (isCustom) {
            if (customColorBtn) {
                customColorBtn.classList.add('active');
                customColorBtn.style.borderColor = '#ffffff';
                customColorBtn.style.transform = 'scale(1.2)';
                customColorBtn.style.boxShadow = `0 0 12px ${colorHex}`;
            }
            if (editorThemePicker) {
                editorThemePicker.value = colorHex;
            }
        } else {
            if (customColorBtn) {
                customColorBtn.classList.remove('active');
                customColorBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                customColorBtn.style.transform = 'scale(1)';
                customColorBtn.style.boxShadow = 'none';
            }

            // Find matching chip and set active
            colorChips.forEach(chip => {
                if (chip.dataset.color.toLowerCase() === colorHex.toLowerCase()) {
                    chip.classList.add('active');
                    chip.style.borderColor = '#ffffff';
                    chip.style.transform = 'scale(1.2)';
                    chip.style.boxShadow = `0 0 10px ${colorHex}`;
                }
            });
        }

        // Apply theme immediately for live preview
        applyTheme(colorHex);
    }

    // Register color bar listeners dynamically
    document.addEventListener('click', (e) => {
        const chip = e.target.closest('.color-chip');
        if (chip) {
            selectColor(chip.dataset.color);
        }
    });

    const themePicker = document.getElementById('editor-theme-picker');
    if (themePicker) {
        themePicker.addEventListener('input', () => {
            selectColor(themePicker.value, true);
        });
    }

    // Save editor settings changes
    editorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        config.templeTitle = editorInputTempleTitle.value.trim();
        config.templeSubtitle = editorInputTempleSubtitle.value.trim();
        config.eventHeader = editorInputEventHeader.value.trim();
        config.eventTitle = editorInputEventTitle.value.trim();
        config.eventDesc = editorInputEventDesc.value.trim();
        config.eventDate = editorInputEventDate.value.trim();
        config.eventTime = editorInputEventTime.value.trim();
        config.theme = editorInputTheme.value;
        
        const editorInputContact = document.getElementById('editor-contact');
        if (editorInputContact) {
            config.contactDetails = editorInputContact.value.trim();
        }

        // Handle dynamic flyer image uploader asynchronously
        const file = editorInputFlyerFile.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                config.flyerImage = event.target.result;
                saveAndApplyConfig();
            };
            reader.readAsDataURL(file);
        } else {
            saveAndApplyConfig();
        }
    });

    function saveAndApplyConfig() {
        db.collection("temple").doc("config").set(config).then(() => {
            alert('ల్యాండింగ్ పేజీ సెట్టింగ్‌లు మరియు ఆహ్వాన పత్రిక విజయవంతంగా అప్‌డేట్ చేయబడ్డాయి!');
            closeModal();
        }).catch(err => {
            console.error("Firebase write error:", err);
            alert("Error saving configurations. Please check your Firebase Database Rules.");
        });
    }

    // Populate transaction list inside table
    function renderTransactionsTable() {
        // Calculate dynamic administrative stats
        const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
        const confirmedAmount = donations.reduce((sum, d) => sum + (d.status === 'Verified' ? d.amount : 0), 0);
        const rejectedAmount = donations.reduce((sum, d) => sum + (d.status === 'Rejected' ? d.amount : 0), 0);

        const totalStatElem = document.getElementById('admin-stat-total');
        const confirmedStatElem = document.getElementById('admin-stat-confirmed');
        const rejectedStatElem = document.getElementById('admin-stat-rejected');

        if (totalStatElem) totalStatElem.textContent = `₹${totalAmount.toLocaleString('en-IN')}`;
        if (confirmedStatElem) confirmedStatElem.textContent = `₹${confirmedAmount.toLocaleString('en-IN')}`;
        if (rejectedStatElem) rejectedStatElem.textContent = `₹${rejectedAmount.toLocaleString('en-IN')}`;

        adminTableBody.innerHTML = '';
        
        if (donations.length === 0) {
            adminTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No donations recorded yet.</td></tr>`;
            return;
        }

        donations.forEach(donation => {
            const tr = document.createElement('tr');
            
            let statusBadge = '';
            let actionButtons = '';
            
            if (donation.status === 'Verified') {
                statusBadge = `<span class="badge-status success" style="background: rgba(0, 230, 118, 0.1); color: var(--success-green);">Verified</span>`;
                actionButtons = `<span style="font-size: 0.8rem; color: var(--success-green); font-weight:600;"><i class="fa-solid fa-circle-check"></i> Verified</span>`;
            } else if (donation.status === 'Rejected') {
                statusBadge = `<span class="badge-status" style="background: rgba(244, 67, 54, 0.1); color: #f44336; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Rejected</span>`;
                actionButtons = `<span style="font-size: 0.8rem; color: #f44336; font-weight:600;"><i class="fa-solid fa-circle-xmark"></i> Rejected</span>`;
            } else if (donation.status === 'Screenshot Submitted') {
                statusBadge = `<span class="badge-status" style="background: rgba(26,115,232,0.12); color: #4fc3f7; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;"><i class="fa-solid fa-image" style="margin-right:3px;"></i>Proof Sent</span>`;
                actionButtons = `
                    <div style="display: flex; gap: 0.5rem; justify-content: center; flex-direction: column; align-items: center;">
                        <button class="btn-export btn-action-verify" data-txn="${donation.txnId}" style="border-color: var(--success-green); color: var(--success-green); padding: 0.2rem 0.6rem; font-size: 0.75rem;">
                            Verify
                        </button>
                        <button class="btn-export btn-action-reject" data-txn="${donation.txnId}" style="border-color: #f44336; color: #f44336; padding: 0.2rem 0.6rem; font-size: 0.75rem;">
                            Reject
                        </button>
                    </div>
                `;
            } else {
                statusBadge = `<span class="badge-status" style="background: rgba(223, 162, 34, 0.1); color: var(--gold-primary); padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Pending</span>`;
                actionButtons = `
                    <div style="display: flex; gap: 0.5rem; justify-content: center;">
                        <button class="btn-export btn-action-verify" data-txn="${donation.txnId}" style="border-color: var(--success-green); color: var(--success-green); padding: 0.2rem 0.6rem; font-size: 0.75rem;">
                            Verify
                        </button>
                        <button class="btn-export btn-action-reject" data-txn="${donation.txnId}" style="border-color: #f44336; color: #f44336; padding: 0.2rem 0.6rem; font-size: 0.75rem;">
                            Reject
                        </button>
                    </div>
                `;
            }

            // Screenshot proof thumbnail
            const screenshotCell = donation.screenshotUrl
                ? `<td style="text-align:center;">
                      <img src="${donation.screenshotUrl}" 
                           alt="Payment Proof" 
                           style="width:44px; height:44px; object-fit:cover; border-radius:6px; border:1px solid var(--gold-primary); cursor:pointer; transition:transform 0.2s;"
                           title="Click to view full screenshot"
                           onclick="window.open(this.src)" 
                           onmouseover="this.style.transform='scale(1.15)'" 
                           onmouseout="this.style.transform='scale(1)'">
                   </td>`
                : `<td style="text-align:center; color: rgba(255,255,255,0.25); font-size:0.75rem;">—</td>`;

            tr.innerHTML = `
                <td>${donation.date}</td>
                <td style="font-weight: 600;">${donation.name}</td>
                <td>${donation.phone}</td>
                <td style="color: var(--gold-secondary); font-weight: 700;">₹${donation.amount.toLocaleString('en-IN')}</td>
                <td>${statusBadge}</td>
                ${screenshotCell}
                <td style="text-align: center;">${actionButtons}</td>
            `;
            adminTableBody.appendChild(tr);
        });
    }

    // Register event listener for table actions (Verify / Reject) using event delegation
    adminTableBody.addEventListener('click', (e) => {
        const target = e.target;
        
        if (target.classList.contains('btn-action-verify')) {
            const txnId = target.dataset.txn;
            updateDonationStatus(txnId, 'Verified');
        } else if (target.classList.contains('btn-action-reject')) {
            const txnId = target.dataset.txn;
            if (confirm('Are you sure you want to reject this entry?')) {
                updateDonationStatus(txnId, 'Rejected');
            }
        }
    });

    function updateDonationStatus(txnId, newStatus) {
        donations = donations.map(d => {
            if (d.txnId === txnId) {
                return { ...d, status: newStatus };
            }
            return d;
        });
        db.collection("temple").doc("donations").set({ list: donations })
            .then(() => {
                console.log("Donation status updated successfully!");
            })
            .catch(err => {
                console.error("Firebase write error:", err);
                alert("Error updating status: " + err.message + "\n\nPlease check your Firestore security rules!");
            });
    }

    // Clear All Donors
    btnClearDonors.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the entire contribution history? This action cannot be undone.')) {
            donations = [];
            db.collection("temple").doc("donations").set({ list: donations }).then(() => {
                alert('Contribution history cleared successfully!');
            }).catch(err => {
                console.error("Firebase write error:", err);
                alert("Error clearing history: " + err.message + "\n\nPlease check your Firebase Database Rules.");
            });
        }
    });

    // Live page stats renderer
    function updateDashboardStats() {
        const totalDonationsElem = document.getElementById('stat-total-donations');
        const donorCountElem = document.getElementById('stat-donors-count');

        if (totalDonationsElem && donorCountElem) {
            const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
            const totalDonors = donations.length;

            // Beautiful count-up style loading
            totalDonationsElem.textContent = `₹${totalAmount.toLocaleString('en-IN')}`;
            donorCountElem.textContent = totalDonors;
        }
    }

    // Export transaction logs to CSV directly inside donor's browser
    btnExportCsv.addEventListener('click', () => {
        if (donations.length === 0) {
            alert('No data available for download.');
            return;
        }

        let csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Transaction ID,Date & Time,Donor Name,Phone Number,Amount (INR),Status\r\n';

        donations.forEach(d => {
            const row = `"${d.txnId}","${d.date}","${d.name}","${d.phone}",${d.amount},"${d.status}"`;
            csvContent += row + '\r\n';
        });

        const encodedUri = encodeURI(csvContent);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', encodedUri);
        downloadAnchor.setAttribute('download', `temple_contributions_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        document.body.removeChild(downloadAnchor);
    });

    // ---------------------------------------------------------
    // 8. Canvas Confetti Effect (Self-contained Vanilla)
    // ---------------------------------------------------------
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    let confettiActive = false;
    let particles = [];
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#dfa222', '#ffd700'];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height - 20,
            r: Math.random() * 6 + 4,
            d: Math.random() * canvas.height,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.random() * 10 - 5,
            tiltAngleIncremental: Math.random() * 0.07 + 0.02,
            tiltAngle: 0
        };
    }

    function startConfetti() {
        particles = [];
        for (let i = 0; i < 150; i++) {
            particles.push(createParticle());
        }
        confettiActive = true;
        drawConfettiFrame();
        
        // Stop animation after 5 seconds to free CPU cycles
        setTimeout(() => {
            confettiActive = false;
        }, 5000);
    }

    function drawConfettiFrame() {
        if (!confettiActive) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        requestAnimationFrame(drawConfettiFrame);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach((p, idx) => {
            p.tiltAngle += p.tiltAngleIncremental;
            p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
            p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
            ctx.stroke();

            // Reset particles that fall past viewport
            if (p.y > canvas.height) {
                particles[idx] = createParticle();
                particles[idx].y = -20;
            }
        });
    }

    // Helper: Formatted Timestamp
    function getFormattedTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // key 0 to 12
        const strTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
        return `${year}-${month}-${day} ${strTime}`;
    }
});
