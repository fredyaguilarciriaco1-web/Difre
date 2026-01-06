const tablaBarras = {
    "1/4": { a: 0.32, d: 0.64 }, "3/8": { a: 0.71, d: 0.95 },
    "1/2": { a: 1.29, d: 1.27 }, "5/8": { a: 1.99, d: 1.59 },
    "3/4": { a: 2.85, d: 1.91 }, "1": { a: 5.10, d: 2.54 }
};

let ultimosCalculos = {}; 

function calcular() {
    const Mu = Number(document.getElementById("Mu").value);
    const fy = Number(document.getElementById("fy").value);
    const fc = Number(document.getElementById("fc").value);
    const b = Number(document.getElementById("b").value);
    const h = Number(document.getElementById("h").value);
    const rec = Number(document.getElementById("rec").value);
    const tEst = document.getElementById("tipoEstribo").value;
    const dEst = tablaBarras[tEst].d;

    const nS = parseInt(document.getElementById("nSup").value) || 0;
    const tS = document.getElementById("barraTipoSup").value;
    const asSupReal = tablaBarras[tS].a * nS;
    const dbS = tablaBarras[tS].d;

    const n1 = parseInt(document.getElementById("nCapa1").value) || 0;
    const t1 = document.getElementById("barraTipo1").value;
    const db1 = tablaBarras[t1].d;
    const as1 = tablaBarras[t1].a * n1;

    const n2 = parseInt(document.getElementById("nCapa2").value) || 0;
    const t2 = document.getElementById("barraTipo2").value;
    const db2 = tablaBarras[t2].d;
    const as2 = tablaBarras[t2].a * n2;

    const asTotalColocado = as1 + as2;

    let s_libre = n1 > 1 ? (b - (2 * rec) - (2 * dEst) - (n1 * db1)) / (n1 - 1) : 99;
    let y1 = rec + dEst + db1 / 2;
    let y2 = rec + dEst + db1 + 2.54 + db2 / 2;
    let d_efect = n2 > 0 ? h - ((as1 * y1 + as2 * y2) / (as1 + as2)) : h - y1;

    let as_min = (0.7 * Math.sqrt(fc) / fy) * b * d_efect;
    let beta1 = fc <= 280 ? 0.85 : Math.max(0.65, 0.85 - (0.05 * (fc - 280)) / 70);
    let as_max = 0.75 * (0.85 * beta1 * (fc / fy) * (6000 / (6000 + fy))) * b * d_efect;
    let a_bloque = d_efect - Math.sqrt(Math.pow(d_efect, 2) - (2 * Mu * 1e5) / (0.9 * 0.85 * fc * b));
    let as_req = (Mu * 1e5) / (0.9 * fy * (d_efect - a_bloque / 2));
    
    // El acero superior suele pedirse como 1/3 o 1/2 del acero inferior en apoyos, o As min.
    let asSupMinimo = Math.max(as_min, as_req * 0.33);

    ultimosCalculos = { Mu, fc, fy, b, h, rec, tEst, as_min, as_max, as_req, asTotalColocado, asSupReal, s_libre, nS, tS, n1, t1, n2, t2 };

    let alertas = "";
    if (s_libre < 2.54) {
        alertas += `<div class="alerta-roja">⚠️ ESPACIO S1: ${s_libre.toFixed(2)} cm. ¡USE 2 CAPAS!</div>`;
    }
    if (asTotalColocado < as_req) {
        alertas += `<div class="alerta-roja">⚠️ ACERO INF. INSUFICIENTE (Falta: ${(as_req - asTotalColocado).toFixed(2)} cm²)</div>`;
    }
    if (asSupReal >= asSupMinimo) {
        alertas += `<div class="alerta-verde">✔ ACERO SUPERIOR CONFORME (${asSupReal.toFixed(2)} cm²)</div>`;
    } else {
        alertas += `<div class="alerta-roja">⚠️ ACERO SUP. BAJO EL MÍNIMO (${asSupMinimo.toFixed(2)} cm²)</div>`;
    }

    document.getElementById("resultado").innerHTML = alertas + `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px; border-top:1px solid #eee; padding-top:8px;">
            <span><b>As Mín:</b> ${as_min.toFixed(2)} cm²</span>
            <span><b>As Máx:</b> ${as_max.toFixed(2)} cm²</span>
            <span><b>As Requerido:</b> ${as_req.toFixed(2)} cm²</span>
            <span><b>As Colocado:</b> ${asTotalColocado.toFixed(2)} cm²</span>
        </div>
    `;

    dibujarViga(b, h, rec, dEst, db1, n1, db2, n2, dbS, nS);
}

function dibujarViga(b, h, rec, dEst, db1, n1, db2, n2, dbS, nS) {
    const canvas = document.getElementById("grafico");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const esc = Math.min(320 / b, 320 / h);
    const b_px = b * esc; const h_px = h * esc;
    const x0 = (canvas.width - b_px) / 2;
    const y0 = (canvas.height - h_px) / 2;
    ctx.fillStyle = "#dfe6e9"; ctx.fillRect(x0, y0, b_px, h_px);
    ctx.strokeStyle = "#2d3436"; ctx.lineWidth = dEst * esc * 0.5;
    ctx.strokeRect(x0 + rec * esc, y0 + rec * esc, b_px - 2 * rec * esc, h_px - 2 * rec * esc);
    let rec_t = rec + dEst;
    dibujarBarras(ctx, n1, db1, x0, y0, h_px, b_px, rec_t, esc, rec_t, "#000");
    if (n2 > 0) dibujarBarras(ctx, n2, db2, x0, y0, h_px, b_px, rec_t, esc, rec_t + db1 + 2.54, "#000");
    dibujarBarras(ctx, nS, dbS, x0, y0, h_px, b_px, rec_t, esc, h - rec_t - dbS, "#000");
}

function dibujarBarras(ctx, n, db, x0, y0, h_px, b_px, rec_t, esc, y_d, color) {
    if (n <= 0) return;
    let r = (db / 2) * esc;
    let y = y0 + h_px - (y_d * esc) - r;
    for (let i = 0; i < n; i++) {
        let x = n > 1 ? (x0 + rec_t * esc + r) + i * ((b_px - 2 * rec_t * esc - 2 * r) / (n - 1)) : x0 + b_px / 2;
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
}

function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const u = ultimosCalculos;

    // Estilo de Título
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("MEMORIA DE CÁLCULO ESTRUCTURAL", 105, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text("DISEÑO DE VIGA DE CONCRETO ARMADO - E.060", 105, 22, { align: "center" });

    // 1. Datos de Entrada
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(12);
    doc.text("1. ESPECIFICACIONES TÉCNICAS Y GEOMETRÍA", 20, 45);
    doc.setDrawColor(44, 62, 80);
    doc.line(20, 47, 100, 47);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    let y = 55;
    const datosEntrada = [
        ["Momento Último (Mu):", u.Mu + " tn.m"],
        ["Resistencia Concreto (f'c):", u.fc + " kg/cm²"],
        ["Fluencia Acero (fy):", u.fy + " kg/cm²"],
        ["Dimensiones (b x h):", u.b + " x " + u.h + " cm"],
        ["Recubrimiento (r):", u.rec + " cm"],
        ["Estribo utilizado:", "Ø " + u.tEst + '"']
    ];
    datosEntrada.forEach(d => {
        doc.setFont("helvetica", "bold"); doc.text(d[0], 25, y);
        doc.setFont("helvetica", "normal"); doc.text(d[1], 80, y);
        y += 7;
    });

    // 2. Acero Instalado
    y += 5;
    doc.setTextColor(44, 62, 80);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("2. ARMADURA DE REFUERZO INSTALADA", 20, y);
    doc.line(20, y+2, 100, y+2);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    y += 10;
    const aceroInstalado = [
        ["Refuerzo Superior:", u.nS + " Ø " + u.tS + '" (' + u.asSupReal.toFixed(2) + " cm²)"],
        ["Refuerzo Inf. Capa 1:", u.n1 + " Ø " + u.t1 + '"'],
        ["Refuerzo Inf. Capa 2:", u.n2 + " Ø " + u.t2 + '"'],
        ["ACERO TOTAL INFERIOR:", u.asTotalColocado.toFixed(2) + " cm²"]
    ];
    aceroInstalado.forEach(d => {
        doc.setFont("helvetica", "bold"); doc.text(d[0], 25, y);
        doc.setFont("helvetica", "normal"); doc.text(d[1], 80, y);
        y += 7;
    });

    // 3. Resultados y Límites
    y += 5;
    doc.setTextColor(44, 62, 80);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("3. RESULTADOS DEL CÁLCULO Y LÍMITES", 20, y);
    doc.line(20, y+2, 100, y+2);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    y += 10;
    const resultados = [
        ["Acero Mínimo (As min):", u.as_min.toFixed(2) + " cm²"],
        ["Acero Máximo (As max):", u.as_max.toFixed(2) + " cm²"],
        ["Acero Requerido Flexión:", u.as_req.toFixed(2) + " cm²"],
        ["Espaciamiento S1:", u.s_libre.toFixed(2) + " cm " + (u.s_libre < 2.54 ? '(¡ALERTA!)' : '(OK)')]
    ];
    resultados.forEach(d => {
        doc.setFont("helvetica", "bold"); doc.text(d[0], 25, y);
        doc.setFont("helvetica", "normal"); doc.text(d[1], 80, y);
        y += 7;
    });

    // 4. Esquema Gráfico
    doc.addImage(document.getElementById("grafico").toDataURL("image/png"), 'PNG', 60, y + 10, 90, 95);

    doc.save("Memoria_Tecnica_Viga.pdf");
}