
        import { auth, db, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "./services/firebase.js";
        import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
        import { CK, Storage } from "./storage.js";
        import { setState } from "./core/store.js";
       import { initHeader } from "./ui/header.js";
       
       
       let currentUser = null;

        const CACHE_VERSION = "v2";

        Object.keys(localStorage).forEach(k => {

            if (k.includes("_course_") && !k.startsWith(CACHE_VERSION)) {

                localStorage.removeItem(k);

            }

        });

        const courseCache = {};


        const params = new URLSearchParams(window.location.search);
        const urlId = params.get('id') || 'algebra';

        const COURSE_ID = urlId;

        document.addEventListener("DOMContentLoaded", () => {

           

            const nombreCurso =
                urlId.charAt(0).toUpperCase() + urlId.slice(1);

            document.title = "Cachimboz - " + nombreCurso;

            const titleDisplay =
                document.getElementById('course-title-display');
            if (titleDisplay)
                titleDisplay.textContent = nombreCurso;

            const sidebarTitle =
                document.getElementById('sidebar-course-name');
            if (sidebarTitle)
                sidebarTitle.textContent = nombreCurso;
        });

        const GK = n => `cachimboz_${n}`;


        let app = {
            data: null, flatList: [], currentIdx: 0,
            completed: new Set(), favorites: new Set(),
            clicks: 0, tab: 'temario',
            quiz: { q: [], current: 0, score: 0, mode: 'premium' },
            quizUsed: {}
        };


        document.addEventListener('DOMContentLoaded', () => {

            loadStorage();

            fetchData();

            //   renderSidebar();     

            //  loadLesson(app.currentIdx, false); 
        });

        function loadStorage() {
            const courseId = COURSE_ID;
            const uid = currentUser?.uid || null;
            app.completed = Storage.getCompleted(courseId, uid);
            if (!uid) {
                app.completed = new Set();
                app.currentIdx = 0;
            }
            app.favorites = uid
                ? Storage.getFavorites(courseId, uid)
                : new Set();       
            app.currentIdx = Storage.getLastIndex(courseId, uid);
            app.quizUsed = Storage.getQuizUsage(courseId, uid);
            app.clicks = Storage.getCourseClicks(courseId, uid);

            updateUIState();
        }






        function renderSidebar() {
            const container = document.getElementById('sidebar-content'); container.innerHTML = '';
            if (app.tab === 'favoritos') { renderFavoritesList(container); return; }
            if (!app.data) return;
            app.data.forEach((tema) => {
                const block = document.createElement('div'); block.className = 'module-block';
                let doneCount = 0; const temaVideos = app.flatList.filter(v => v.tema === tema.titulo);
                temaVideos.forEach(v => { if (app.completed.has(v.globalId)) doneCount++; });
                block.innerHTML = `<div class="module-header">${tema.titulo} <span class="module-count">${doneCount}/${tema.videos.length}</span></div>`;
                temaVideos.forEach(vid => { block.appendChild(createLessonItem(vid)); });
                container.appendChild(block);
            });
        }

        function createLessonItem(vid) {
            const el = document.createElement('div');
            el.dataset.id = vid.globalId;
            const isDone = app.completed.has(vid.globalId); const isActive = vid.globalId === app.currentIdx; const isFav = app.favorites.has(vid.globalId);
            el.className = `lesson-item ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}`;
            el.onclick = () => { handleVideoClick(vid.globalId); };
            el.innerHTML = `<div class="lesson-status"><i class="fas ${isDone ? 'fa-check' : 'fa-play'}"></i></div><div class="lesson-info"><div class="lesson-title">${vid.titulo}</div><div class="lesson-sub">Lección ${vid.globalId + 1}</div></div>${isFav ? '<i class="fas fa-heart" style="color:var(--favorite); font-size:10px;"></i>' : ''}`;
            return el;
        }

        function handleVideoClick(idx) {
            const targetVid = app.flatList[idx];
            if (!targetVid) return;
            if (targetVid.tIdx >= 2 && !Storage.hasAccess()) {
                if (window.innerWidth < 768 && document.getElementById('sidebar').classList.contains('open')) {
                    toggleSidebar();
                }
                openSales();
                return;
            }
            loadLesson(idx, true);
            if (window.innerWidth < 768) {
                const sb = document.getElementById('sidebar');
                if (sb.classList.contains('open')) toggleSidebar();
            }
        }





        async function loadLesson(idx, countClick) {


            if (idx < 0 || idx >= app.flatList.length) return;

            const lesson = app.flatList[idx];
            const container = document.getElementById("video-container");

            const thumb = `https://i.ytimg.com/vi/${lesson.youtube_id}/hqdefault.jpg`;

            app.currentIdx = idx;
            Storage.setLastIndex(idx, COURSE_ID, currentUser?.uid);

            if (!app.completed.has(idx)) {
                app.completed.add(idx);
                Storage.saveCompleted(app.completed, COURSE_ID, currentUser?.uid);
            }

            if (currentUser) {
                try {
                    await updateDoc(doc(db, 'users', currentUser.uid), {
                        [`progress.${COURSE_ID}`]: {
                            completed: Array.from(app.completed),
                            currentIdx: app.currentIdx
                        }
                    });
                } catch (err) {
                    console.error('Error guardando progreso:', err);
                }
            }

            if (countClick) {
                await updateStudyStreak();
            }

            container.innerHTML = `
<div id="video-thumb" style="position:relative;width:100%;height:100%;cursor:pointer">
<img src="${thumb}" style="width:100%;height:100%;object-fit:cover">
<div style="
position:absolute;
top:50%;
left:50%;
transform:translate(-50%,-50%);
font-size:70px;
color:white">
▶
</div>
</div>
`;

            document.getElementById("video-thumb").onclick = () => {
                container.innerHTML = `
<iframe
src="https://www.youtube-nocookie.com/embed/${lesson.youtube_id}?autoplay=1"
loading="lazy"
style="width:100%;height:100%;border:none"
allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
allowfullscreen>
</iframe>`;
            };



            document.getElementById('video-title').textContent = lesson.titulo;
            document.getElementById('module-name').textContent = lesson.tema;
            document.getElementById('lesson-index').textContent = idx + 1;

            updateUIState();
            updateActiveLesson();

            if (countClick) {
                app.clicks++;
                Storage.setCourseClicks(app.clicks, COURSE_ID, currentUser?.uid);

                if (app.clicks % 5 === 0) {
                    setTimeout(openViral, 5000);
                }
            }
            prefetchNextVideo();


        }


        function openViral() { document.getElementById('viral-overlay').classList.add('show'); document.getElementById('viral-modal').classList.add('show'); }
        function closeViral() { document.getElementById('viral-overlay').classList.remove('show'); document.getElementById('viral-modal').classList.remove('show'); }
        window.closeViral = closeViral;

        function viralShared() {
            const shareText = "¡Estoy practicando en Cachimboz y el método es brutal! 🚀";
            window.location.href = "whatsapp://send?text=" + encodeURIComponent(shareText); setTimeout(() => { closeViral(); }, 2000);
        }
        window.viralShared = viralShared;
        function updateUIState() {
            const isFav = app.favorites.has(app.currentIdx);
            const isPremium = Storage.hasAccess();

            const btn = document.getElementById('current-fav-btn');
            if (btn) {
                btn.innerHTML = isFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
                btn.className = `main-fav-btn ${isFav ? 'active' : ''}`;
            }

            const favCountEl = document.getElementById('header-fav-count');
            if (favCountEl) favCountEl.textContent = String(app.favorites.size);

            const btnPrev = document.getElementById('btn-prev');
            if (btnPrev) btnPrev.disabled = app.currentIdx === 0;
            const btnNext = document.getElementById('btn-next');
            if (btnNext) btnNext.disabled = app.currentIdx === app.flatList.length - 1;

            const pdfLock = document.getElementById('pdf-lock');
            if (pdfLock) pdfLock.style.display = isPremium ? 'none' : 'flex';

            const proBadge = document.getElementById('header-pro-badge');
            if (proBadge) proBadge.textContent = isPremium ? 'PRO' : '';

            const quizSub = document.getElementById('quiz-subtitle');
            if (quizSub) {
                if (isPremium) {
                    quizSub.textContent = 'Práctica Intensiva';
                    quizSub.style.color = 'var(--text-sec)';
                } else if (app.quizUsed[app.currentIdx]) {
                    quizSub.textContent = 'Desbloquear Todo';
                    quizSub.style.color = 'var(--danger)';
                } else {
                    quizSub.textContent = '2 Preguntas Gratis';
                    quizSub.style.color = 'var(--success)';
                }
            }

            const currentLesson = app.flatList[app.currentIdx];
            const pdfCard = document.getElementById('pdf-card');
            const actionGrid = document.getElementById('actions-grid');
            if (pdfCard && actionGrid) {
                if (currentLesson && currentLesson.pdf_link && currentLesson.pdf_link.trim() !== "") {
                    pdfCard.style.display = 'block';
                    actionGrid.classList.remove('single-col');
                } else {
                    pdfCard.style.display = 'none';
                    actionGrid.classList.add('single-col');
                }
            }

            const total = app.flatList.length;
            if (total > 0) {
                const done = app.completed.size;
                const pct = Math.round((done / total) * 100);
                const sidebarFill = document.getElementById('sidebar-progress-fill');
                const sidebarText = document.getElementById('sidebar-progress-text');
                if (sidebarFill) sidebarFill.style.width = `${pct}%`;
                if (sidebarText) sidebarText.textContent = `${pct}%`;
            }
        }

        function favoriteKey(courseId, idx) {
            return `${courseId}:${idx}`;
        }

        async function toggleCurrentFavorite() {
            if (!currentUser) {
                showLoginRequired();
                return;
            }

            const btn = document.getElementById('current-fav-btn');
            if (btn) btn.disabled = true;

            const favoriteKeyLocal = app.currentIdx;
            const userRef = doc(db, 'users', currentUser.uid);
            const dbFavoriteKey = favoriteKey(COURSE_ID, favoriteKeyLocal);

            try {
                if (app.favorites.has(favoriteKeyLocal)) {
                    app.favorites.delete(favoriteKeyLocal);
                    await updateDoc(userRef, {
                        favorites: arrayRemove(dbFavoriteKey)
                    });
                    showToast('Favorito eliminado 👍');
                } else {
                    app.favorites.add(favoriteKeyLocal);
                    await updateDoc(userRef, {
                        favorites: arrayUnion(dbFavoriteKey)
                    });
                    showToast('Favorito agregado ⭐');
                }

                Storage.saveFavorites(app.favorites, COURSE_ID, currentUser?.uid);
                updateUIState();
                if (app.tab === 'favoritos') renderSidebar();
            } catch (error) {
                console.error('Error al actualizar favorito:', error);
                showToast('Error al guardar favorito. Intenta de nuevo.');
            } finally {
                if (btn) btn.disabled = false;
            }
        }
        window.toggleCurrentFavorite = toggleCurrentFavorite;

        function switchTab(t) { app.tab = t; document.getElementById('tab-temario').className = `tab-btn ${t === 'temario' ? 'active' : ''}`; document.getElementById('tab-favoritos').className = `tab-btn ${t === 'favoritos' ? 'active' : ''}`; renderSidebar(); }
        window.switchTab = switchTab;
        function nextLesson() { handleVideoClick(app.currentIdx + 1); }
        window.nextLesson = nextLesson;
        function prevLesson() { handleVideoClick(app.currentIdx - 1); }
        window.prevLesson = prevLesson;
        function toggleSidebar() {

            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');

            if (!sidebar || !overlay) return;

            const isOpen = sidebar.classList.contains("open");

            if (isOpen) {
                sidebar.classList.remove('open');
                overlay.classList.remove('show');
            } else {
                sidebar.classList.add('open');
                overlay.classList.add('show');
            }

            if (!sidebar.dataset.loaded) {
                renderSidebar();
                sidebar.dataset.loaded = "true";
            }
        }
    
        
        window.toggleSidebar = toggleSidebar;
        function openFavorites() { switchTab('favoritos'); toggleSidebar(); }
        window.openFavorites = openFavorites;
        function renderFavoritesList(container) {
            const favs = app.flatList.filter(v => app.favorites.has(v.globalId));
            if (favs.length === 0) {
                container.innerHTML = '<div style="text-align:center; opacity:0.5; margin-top:50px;">No tienes favoritos en este curso todavía</div>';
                return;
            }
            favs.forEach(vid => {
                container.appendChild(createLessonItem(vid));
            });
        }

        function handleTutorClick() {
            const lesson = app.flatList[app.currentIdx];

            if (Storage.hasAccess()) {

                showToast(`🤖 Pregúntale al Tutor AI sobre "${lesson.tema}" (próximamente)`);

            } else {

                openSales();

            }
        }
        window.handleTutorClick = handleTutorClick;
        function attemptStartQuiz() { if (Storage.hasAccess()) { startQuiz('premium'); } else { if (app.quizUsed[app.currentIdx]) { openSales(); } else { startQuiz('free_trial'); } } }
        window.attemptStartQuiz = attemptStartQuiz;
        function startQuiz(mode) {
            const lesson = app.flatList[app.currentIdx];
            if (!lesson.preguntas || lesson.preguntas.length === 0) { showToast('No hay preguntas disponibles para este tema.'); return; }
            let pool = [...lesson.preguntas];
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }
            app.quiz.mode = mode; app.quiz.q = pool.slice(0, 10); app.quiz.current = 0; app.quiz.score = 0;
            renderQuizQ(); document.getElementById('quiz-modal').classList.add('show');
        }
        window.startQuiz = startQuiz;
        function renderQuizQ() {
            const lesson = app.flatList[app.currentIdx];
            const container = document.getElementById('quiz-container');
            const q = app.quiz.q[app.quiz.current];
            const qNum = app.quiz.current + 1;
            let mixedOpts = q.opciones.map((txt, i) => { return { txt: txt, originalIdx: i }; });
            for (let i = mixedOpts.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [mixedOpts[i], mixedOpts[j]] = [mixedOpts[j], mixedOpts[i]];
            }

            let html = `<div style="font-size:12px; color:var(--text-sec); margin-bottom:10px;">Pregunta ${qNum} de ${app.quiz.q.length}</div>
                        <div class="question-card"><div style="font-size:18px; font-weight:700; line-height:1.4; color:white;">${q.pregunta}</div></div>
                        <div style="display:flex; flex-direction:column; gap:8px;">`;

            mixedOpts.forEach((optObj, idx) => {
                html += `<div class="quiz-opt" data-idx="${optObj.originalIdx}" onclick="checkAnswer(this, ${optObj.originalIdx}, ${q.correcta})">
                            <div class="opt-circle">${String.fromCharCode(65 + idx)}</div><div style="font-size:15px; color:white;">${optObj.txt}</div>
                        </div>`;
            });
            html += '</div>';

            if (q.resolucion) {
                html += `<div id="res-box" class="resolution-box" style="display:none;">
                            <strong><i class="fas fa-lightbulb"></i> Resolución:</strong><br>
                            ${q.resolucion}
                         </div>
                         <button id="btn-next-q" class="btn-next-q" onclick="nextQuestionManual()">
                            Siguiente Pregunta <i class="fas fa-arrow-right"></i>
                         </button>`;
            } else {
                html += `<button id="btn-next-q" class="btn-next-q" onclick="nextQuestionManual()">
                            Siguiente Pregunta <i class="fas fa-arrow-right"></i>
                         </button>`;
            }


            container.innerHTML = html;

            const text = q.pregunta + q.opciones.join("");

            if (text.includes("$")) {

                loadMathJax();

                if (window.MathJaxLoaded) {
                    MathJax.typesetPromise();
                }

            }
        }

        function checkAnswer(el, idx, correct) {
            if (el.classList.contains('checked')) return;
            const parent = el.parentElement; const opts = parent.querySelectorAll('.quiz-opt');
            opts.forEach(o => { o.classList.add('checked'); o.onclick = null; });

            if (idx === correct) { el.classList.add('correct'); el.querySelector('.opt-circle').innerHTML = '<i class="fas fa-check"></i>'; app.quiz.score++; }
            else { el.classList.add('wrong'); el.querySelector('.opt-circle').innerHTML = '<i class="fas fa-times"></i>'; opts.forEach(o => { if (parseInt(o.dataset.idx) === correct) { o.classList.add('correct'); o.querySelector('.opt-circle').innerHTML = '<i class="fas fa-check"></i>'; } }); }

            const resBox = document.getElementById('res-box'); if (resBox) resBox.style.display = 'block';
            const btnNext = document.getElementById('btn-next-q'); if (btnNext) btnNext.style.display = 'block';
        }

        window.checkAnswer = checkAnswer;

        function nextQuestionManual() {
            if (app.quiz.mode === 'free_trial' && app.quiz.current === 1) {
                Storage.setQuizUsed(app.currentIdx, app.quizUsed, COURSE_ID);

                updateUIState();
                closeQuiz();
                openSales();
                return;
            }
            app.quiz.current++;
            if (app.quiz.current < app.quiz.q.length) { renderQuizQ(); } else { showQuizResults(); }
        }
        window.nextQuestionManual = nextQuestionManual;


        function showQuizResults() {
            const container = document.getElementById('quiz-container');
            const percent = Math.round((app.quiz.score / app.quiz.q.length) * 100);
            let rank = 'Aspirante'; let msg = 'Sigue intentando'; let color = 'var(--text-sec)'; let stars = '';

            if (percent === 100) { rank = '¡Cómputo General!'; msg = 'Dominio total del tema'; color = 'var(--success)'; stars = '★★★★★'; }
            else if (percent >= 80) { rank = 'Cachimbo Excelencia'; msg = 'Estás casi listo'; color = 'var(--success)'; stars = '★★★★☆'; }
            else if (percent >= 60) { rank = 'Postulante Serio'; msg = 'Buen progreso'; color = 'var(--warning)'; stars = '★★★☆☆'; }
            else if (percent >= 40) { rank = 'Novato'; msg = 'Falta repasar'; color = 'var(--danger)'; stars = '★★☆☆☆'; }
            else { rank = 'Turista'; msg = 'Necesitas ver el video'; color = 'var(--danger)'; stars = '★☆☆☆☆'; }

            container.innerHTML = `
                <div class="result-card">
                    <div style="margin-top:20px; margin-bottom:10px;"><i class="fas fa-crown" style="font-size:60px; color:${color}; margin-bottom:15px; filter:drop-shadow(0 0 10px ${color})"></i></div>
                    <span class="rank-badge" style="color:${color}; border-color:${color};">${rank}</span>
                    <div class="score-big">${percent}%</div>
                    <div class="stars-row">${stars}</div>
                    <p style="opacity:0.8; font-size:15px; margin-bottom:30px; color:#ddd;">Respondiste correctamente <b>${app.quiz.score}</b> de <b>${app.quiz.q.length}</b> preguntas. <br>${msg}</p>
                    <button class="nav-btn" onclick="startQuiz('premium')" style="width:100%; background:var(--surface); border:2px solid var(--primary); color:white; margin-bottom:12px; border-radius:var(--radius-btn);"><i class="fas fa-redo"></i> Intentar de nuevo</button>
                    <button class="nav-btn" onclick="closeQuiz()" style="width:100%; background:var(--gradient-btn); border-radius:var(--radius-btn);">Finalizar Práctica</button>
                </div>`;
        }

        function downloadTopicPDF() {
            if (!Storage.hasAccess()) {
                openSales();
                return;
            }
            const lesson = app.flatList[app.currentIdx];
            const topic = app.data[lesson.tIdx];

            if (topic && topic.pdf_resuelto && topic.pdf_resuelto.trim() !== "") {
                window.open(topic.pdf_resuelto, '_blank');
            } else {
                showToast("PDF no disponible para este tema");
            }
        }
        window.downloadTopicPDF = downloadTopicPDF;


        async function openPDF() {

            const premium = Storage.getPremiumGlobal();
            const course = Storage.getCourseAccess();

            const token = premium?.token || course?.token;

            if (!token) {
                openSales();
                return;
            }

            const link = app.flatList[app.currentIdx].pdf_link;

            try {

                const controller = new AbortController();

                const timeout = setTimeout(() => {
                    controller.abort();
                }, 5000);

                const resp = await fetch(
                    "https://us-central1-cachimboz-pro.cloudfunctions.net/getSecurePDF",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            token: token,
                            pdf: link
                        }),
                        signal: controller.signal
                    }
                );

                clearTimeout(timeout);

                const data = await resp.json();

                if (!data.ok) {
                    openSales();
                    return;
                }

                window.open(data.url, "_blank");

            } catch (err) {
                console.error(err);
                openSales();
            }
        }


        window.openPDF = openPDF;
        function openSales() {
            
             updateSalesModalAuth(currentUser); 
             document.getElementById('sales-overlay').classList.add('show'); 
             document.getElementById('sales-modal').classList.add('show'); }
        function closeSales() { document.getElementById('sales-overlay').classList.remove('show'); document.getElementById('sales-modal').classList.remove('show'); }

        function showLoginRequired() {
            document.getElementById('login-required-overlay').style.display = 'block';
            document.getElementById('login-required-modal').style.display = 'block';
        }
        window.showLoginRequired = showLoginRequired;

        function closeLoginRequired() {
            document.getElementById('login-required-overlay').style.display = 'none';
            document.getElementById('login-required-modal').style.display = 'none';
        }
        window.closeLoginRequired = closeLoginRequired;

        window.closeSales = closeSales;
        function toggleVerify() { const box = document.getElementById('verify-box'); box.style.display = box.style.display === 'none' ? 'block' : 'none'; }
        window.toggleVerify = toggleVerify;

        async function verifySub() {
            let email = currentUser?.email || document.getElementById('v-email').value.trim().toLowerCase();
            const msg = document.getElementById('v-msg');
            const btn = document.getElementById('btn-verify-action');

            if (currentUser) {
                document.getElementById('v-email').value = email;
            }

            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                msg.style.color = 'var(--danger)'; msg.textContent = 'Ingresa un correo válido.';
                return;
            }

            if (Storage.hasAccess()) {
                msg.style.color = 'var(--success)';
                msg.textContent = 'Ya tienes acceso premium activo.';
                updateSalesModalAuth(currentUser);
                return;
            }

            msg.style.color = 'var(--text-sec)';
            msg.textContent = 'Verificando...';
            btn.disabled = true;



            try {
                const result = await fetch(
                    "https://us-central1-cachimboz-pro.cloudfunctions.net/verifyEmail",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email,
                            course: COURSE_ID
                        })
                    }
                );

                const data = await result.json();
                const access = !!data.access;
                if (!access) {
                    localStorage.removeItem("premium_token");
                    localStorage.removeItem("course_token");

                    msg.style.color = "var(--danger)";
                    msg.textContent = "No tienes suscripción activa.";
                    return;
                }

                // 🔥 SI ES PREMIUM GLOBAL
                if (data.plan?.includes("PRO_PLAN")) {

                    Storage.setPremiumGlobal({
                        email: email,
                        plan: data.plan,
                        start: data.start || "",
                        vencimiento: data.end || "",
                        token: data.token
                    });

                    if (currentUser) {
                        try {
                            await updateDoc(doc(db, 'users', currentUser.uid), {
                                isPremium: true
                            });
                        } catch (err) {
                            console.error('Error guardando premium en Firestore', err);
                        }
                    }

                    msg.style.color = "var(--success)";
                    msg.textContent = "¡PRO activo!";
                    successAction();
                    return;
                }

                // 🔥 ACCESO SOLO CURSO
                Storage.setCourseAccess({
                    email,
                    vencimiento: data.end || "",
                    token: data.token
                });

                if (currentUser) {
                    try {
                        await updateDoc(doc(db, 'users', currentUser.uid), {
                            isPremium: false
                        });
                    } catch (err) {
                        console.error('Error guardando premium en Firestore', err);
                    }
                }

                msg.style.color = "var(--success)";
                msg.textContent = "¡Acceso activado!";
                successAction();

            }
            catch (e) {
                console.error(e);
                msg.style.color = "var(--danger)";
                msg.textContent = "Error de conexión";
            }
            finally {
                btn.disabled = false;
            }
        }
        window.verifySub = verifySub;

        function successAction() { setTimeout(() => { updateUIState(); closeSales(); showToast('¡Bienvenido Premium! Todo desbloqueado.'); }, 1000); }
        function closeQuiz() { document.getElementById('quiz-modal').classList.remove('show'); }

        window.closeQuiz = closeQuiz;
        function showToast(text) { const t = document.getElementById('premium-toast'); document.getElementById('toast-text').innerText = text; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 4000); }

       
        let authChecked = false;
        let isAuthenticated = false;

        function updateAuthUIState() {
            const authOnlyBlocks = document.querySelectorAll('[data-auth-only]');
            const guestOnlyBlocks = document.querySelectorAll('[data-guest-only]');

            authOnlyBlocks.forEach(el => {
                el.style.display = isAuthenticated ? 'block' : 'none';
            });
            guestOnlyBlocks.forEach(el => {
                el.style.display = isAuthenticated ? 'none' : 'block';
            });
        }

        function updateSalesModalAuth(user) {
            const verifyBtn = document.getElementById('sales-verify-btn');
            const verifyBox = document.getElementById('verify-box');
            const loggedHint = document.getElementById('sales-logged-hint');
            const unlockBtn = document.getElementById('sales-unlock-btn');

            if (!verifyBtn || !verifyBox || !loggedHint || !unlockBtn) return;

            if (!user) {
                verifyBtn.style.display = 'block';
                verifyBox.style.display = 'none';
                loggedHint.style.display = 'none';
                unlockBtn.style.display = 'block';
                unlockBtn.textContent = 'DESBLOQUEAR TODO';
                return;
            }

            verifyBtn.style.display = 'none';
            verifyBox.style.display = 'none';

            const premium = Storage.hasAccess();
            if (premium) {
                loggedHint.style.display = 'block';
                loggedHint.textContent = 'Ya tienes acceso premium ✅';
                unlockBtn.style.display = 'none';
            } else {
                loggedHint.style.display = 'block';
                loggedHint.textContent = 'Inicia compra premium para desbloquear.';
                unlockBtn.style.display = 'block';
                unlockBtn.textContent = 'DESBLOQUEAR PREMIUM';
            }
        }

       

        function setupClassAuth() {
            initHeader({ variant: "course" });

            onAuthStateChanged(auth, async (user) => {
                currentUser = user;
                authChecked = true;
                isAuthenticated = !!user;
                updateAuthUIState();
                setState({ user, authLoaded: true });
                initHeader({ variant: "course" });
                updateSalesModalAuth(user);

                const normalizeFavorites = (favorites) => {
                    const loaded = new Set();
                    const canonical = new Set();

                    if (!Array.isArray(favorites)) return { loaded, canonical };

                    for (const fav of favorites) {
                        if (typeof fav === 'string' && fav.includes(':')) {
                            const [cid, idx] = fav.split(':');
                            if (!Number.isNaN(Number(idx))) {
                                canonical.add(`${cid}:${Number(idx)}`);
                                if (cid === COURSE_ID) {
                                    loaded.add(Number(idx));
                                }
                            }
                        } else if (!Number.isNaN(Number(fav))) {
                            // Legacy format: el índice actual del curso
                            const idx = Number(fav);
                            canonical.add(`${COURSE_ID}:${idx}`);
                            loaded.add(idx);
                        }
                    }

                    return { loaded, canonical };
                };

                if (user) {
                    try {
                        const userSnap = await getDoc(doc(db, 'users', user.uid));
                        const data = userSnap.data();

                        const progress = data?.progress?.[COURSE_ID];

                        if (progress) {
                            app.completed = new Set(progress.completed || []);
                            app.currentIdx = progress.currentIdx || 0;

                            // sincronizar también en localStorage
                            Storage.saveCompleted(app.completed, COURSE_ID, user.uid);
                            Storage.setLastIndex(app.currentIdx, COURSE_ID, user.uid);
                        }

                        const { loaded: loadedFavorites, canonical: canonicalFavorites } = normalizeFavorites(data?.favorites);

                        if (loadedFavorites.size > 0) {
                            app.favorites = loadedFavorites;
                            Storage.saveFavorites(app.favorites, COURSE_ID, user.uid);
                        } else {
                            app.favorites = Storage.getFavorites(COURSE_ID, user.uid);
                        }

                        if (typeof data?.isPremium === 'boolean') {
                            setState({ user: { ...user, isPremium: data.isPremium } });
                        }

                        if (data?.favorites && Array.isArray(data.favorites)) {
                            const sourceSet = new Set(data.favorites.map(v => String(v)));
                            const canonicalAsArray = Array.from(canonicalFavorites);

                            if (canonicalAsArray.length !== sourceSet.size || canonicalAsArray.some(c => !sourceSet.has(c))) {
                                await updateDoc(doc(db, 'users', user.uid), {
                                    favorites: canonicalAsArray
                                });
                            }
                        }

                        updateUIState();
                    } catch (err) {
                        console.error('Error cargando favoritos:', err);
                        app.favorites = Storage.getFavorites(COURSE_ID, user.uid);
                    }
                }

                if (!user) {
                    app.favorites = new Set();
                    app.completed = new Set();
                    updateUIState();
                    return;
                }

                updateUIState();
            });
        }

        window.addEventListener('logout', async () => {
            try {
                await signOut(auth);
                localStorage.removeItem("user");
                localStorage.removeItem("streak_date");
                Object.keys(localStorage).forEach(k => {
                    if (k.includes("cachimboz_") || k.includes("streak_")) {
                        localStorage.removeItem(k);
                    }
                });
                Storage.clearAll?.(); 
                location.reload();
                localStorage.removeItem("streak_date");3
                Storage.resetStreak?.();
                currentUser = null;
                app.favorites = new Set();
                app.completed = new Set();
                location.reload();

                showToast('Sesión cerrada');
            } catch (err) {
                console.error(err);
                showToast('Error al cerrar sesión');
            }
        });

        setupClassAuth();

        function autoSaveCurrentCourse() {

            const params = new URLSearchParams(window.location.search);
            const courseId = params.get("id");

            if (!courseId) return;

            // nombre visible (puedes mejorar esto)
            const courseName =
                courseId.charAt(0).toUpperCase() + courseId.slice(1);

            const link = window.location.pathname + "?id=" + courseId;

            Storage.setLastCourse(courseName, link);


        }

        document.addEventListener("DOMContentLoaded", autoSaveCurrentCourse);

        function initCourse(data) {

            processCourse(data)

            renderSidebar()

            const idx = Math.min(app.currentIdx, app.flatList.length - 1)

            loadLesson(idx, false)
            prefetchNextVideo()

        }


        async function fetchData() {

            const params = new URLSearchParams(window.location.search);
            const id = params.get("id");

            const cacheKey = CACHE_VERSION + "_course_" + id;

            const cached = localStorage.getItem(cacheKey);


            if (cached) {

                const data = JSON.parse(cached);

                processCourse(data);
                renderSidebar();

                const idx = Math.min(app.currentIdx, app.flatList.length - 1);
                loadLesson(idx, false);

            }


            const ref = doc(db, "courses", id);
            const snap = await getDoc(ref);

            if (!snap.exists()) return;

            const fresh = snap.data();


            localStorage.setItem(cacheKey, JSON.stringify(fresh));


            if (fresh.index) {

                app.flatList = fresh.index.map((v, i) => ({
                    ...v,
                    globalId: i
                }));

            } else {

                processCourse(fresh);

            }

            renderSidebar();

            const idx = Math.min(app.currentIdx, app.flatList.length - 1);
            loadLesson(idx, false);

        }

        async function refreshCourse(id) {

            const ref = doc(db, "courses", id);

            const snap = await getDoc(ref);

            if (!snap.exists()) return;

            const data = snap.data();

            localStorage.setItem("course_" + id, JSON.stringify(data));

        }

        function processCourse(data) {

            app.data = data.temas || [];
            app.flatList = [];

            let globalIndex = 0;

            app.data.forEach((tema, tidx) => {

                (tema.videos || []).forEach((vid) => {

                    const preguntasFinales = [
                        ...(vid.preguntas || []),
                        ...(tema.preguntas || [])
                    ];

                    app.flatList.push({
                        titulo: vid.titulo,
                        youtube_id: vid.youtube_id,
                        tema: tema.titulo,
                        preguntas: preguntasFinales,
                        globalId: globalIndex,
                        tIdx: tidx,
                        pdf_link: vid.pdf_link || tema.pdf_link || ""
                    });

                    globalIndex++;

                });

            });



        }

        function updateActiveLesson() {
            document.querySelectorAll('.lesson-item')
                .forEach(el => el.classList.remove('active'));

            const el = document.querySelector(`[data-id="${app.currentIdx}"]`);

            if (el) el.classList.add('active');
        }

        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']]
            },
            svg: {
                fontCache: 'global'
            }
        };
        function loadMathJax() {

            if (window.MathJaxLoaded) return;

            const script = document.createElement("script");

            script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js";
            script.defer = true;

            script.onload = () => {
                window.MathJaxLoaded = true;

            };

            document.head.appendChild(script);
        }
        function prefetchNextVideo() {

            for (let i = 1; i <= 2; i++) {

                const next = app.flatList[app.currentIdx + i];
                if (!next) continue;

                const img = new Image();
                img.src = `https://i.ytimg.com/vi/${next.youtube_id}/hqdefault.jpg`;

            }

        }

        async function updateStudyStreak() {

            if (!currentUser) {             
                return;
            }

            if (!authChecked) {
                return;
            }

            const today = new Date().toDateString();

            const last = localStorage.getItem("streak_date");
            let streak = Storage.getStreak(currentUser?.uid);

            if (!last) {
                streak = 1;
                showToast('¡Racha iniciada! 1 día', 'success');
            } else {
                const diff = (Date.now() - new Date(last).getTime()) / 86400000;

                if (diff < 1.5) {
                    // mismo día: no cambia.
                    return;
                }

                if (diff < 2.5) {
                    streak++;
                    showToast(`¡Racha actualizada! ${streak} días`, 'success');
                } else {
                    streak = 1;
                    showToast('Racha reiniciada. ¡Vamos de nuevo!', 'success');
                }
            }

            localStorage.setItem("streak_date", today);
            Storage.setStreak(currentUser?.uid, streak);

            // Guardar racha en Firestore para usuario logueado.
            if (currentUser) {
                try {
                    await updateDoc(doc(db, 'users', currentUser.uid), {
                        streak: streak,
                        streak_date: today
                    });
                } catch (err) {
                    console.error('Error guardando racha en Firestore', err);
                }
            }
        }
window.addEventListener("scroll", () => {
    const header = document.getElementById("shared-header");

    if (window.scrollY > 20) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
});

document.body.style.opacity = "0";

window.addEventListener("load", () => {
    document.body.style.transition = "opacity 0.3s ease";
    document.body.style.opacity = "1";
});