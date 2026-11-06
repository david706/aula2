(function(){
  const svgNS = "http://www.w3.org/2000/svg";
  const pulsesLayer = document.getElementById('pulses');

  const powerPaths = ['p-atx-vrm','p-cpu8pin-vrm','p-vrm-cpu','p-vrm-cpu2','p-vrm-ram','p-vrm-chipset'];
  const ramPaths = ['d-cpu-ram1','d-cpu-ram2','d-cpu-ram3','d-cpu-ram4'];
  const chipsetPaths = ['d-cpu-chipset','d-chipset-sata'];

  const v12Paths = ['p-atx-vrm','p-cpu8pin-vrm','p-vrm-cpu','p-vrm-cpu2'];
  const v5Paths  = ['p-vrm-ram'];
  const v33Paths = ['p-vrm-chipset'];

  const nodeMap = {
    power: ['node-vrm-out','node-cpu-power'],
    voltage: ['node-vrm-out','node-cpu-power','node-ram-in','node-chipset-in'],
    'data-ram': ['node-cpu-data','node-ram-in'],
    'data-chipset': ['node-cpu-data','node-chipset-in','node-sata-in']
  };

  function clearPulses(){
    pulsesLayer.innerHTML = '';
  }

  function makePulse(pathId, cls, dur){
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('r', cls === 'pulse-power' ? 5 : 3);
    circle.setAttribute('class', cls);
    const anim = document.createElementNS(svgNS, 'animateMotion');
    anim.setAttribute('dur', dur + 's');
    anim.setAttribute('repeatCount', 'indefinite');
    anim.setAttribute('rotate', 'auto');
    const mpath = document.createElementNS(svgNS, 'mpath');
    mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + pathId);
    anim.appendChild(mpath);
    circle.appendChild(anim);
    pulsesLayer.appendChild(circle);
  }

  function setTraceState(ids, state){
    ids.forEach(id => {
      const el = document.getElementById(id);
      if(!el) return;
      el.classList.remove('active','dim');
      if(state) el.classList.add(state);
    });
  }

  function setVoltageClasses(on){
    v12Paths.forEach(id => document.getElementById(id) && document.getElementById(id).classList.toggle('v12', on));
    v5Paths.forEach(id => document.getElementById(id) && document.getElementById(id).classList.toggle('v5', on));
    v33Paths.forEach(id => document.getElementById(id) && document.getElementById(id).classList.toggle('v33', on));
  }

  function blinkNodes(mode){
    document.querySelectorAll('.node-dot').forEach(n => n.classList.remove('blink-power','blink-data','blink-v12','blink-v5','blink-v33'));
    if(mode === 'voltage'){
      const map = { 'node-vrm-out':'blink-v12', 'node-cpu-power':'blink-v12', 'node-ram-in':'blink-v5', 'node-chipset-in':'blink-v33' };
      Object.keys(map).forEach(id => {
        const n = document.getElementById(id);
        if(n) n.classList.add(map[id]);
      });
      return;
    }
    const ids = nodeMap[mode] || [];
    const cls = mode === 'power' ? 'blink-power' : 'blink-data';
    ids.forEach(id => {
      const n = document.getElementById(id);
      if(n) n.classList.add(cls);
    });
  }

  function showVoltLabels(show){
    document.querySelectorAll('.volt-label').forEach(l => l.classList.toggle('show', show));
  }

  const infoBox = document.getElementById('info');
  const infoText = document.getElementById('info-text');

  const messages = {
    power: '<div class="tag">Alimentación</div>La energía entra a la placa por los conectores <b>EPS12V (8 pines)</b> y <b>ATX (24 pines)</b>, pasa por el <b>VRM</b> (el disipador con aletas junto al socket) y llega ya regulada a la CPU, la RAM y el chipset. <b>No es una señal, es corriente eléctrica real.</b>',
    voltage: '<div class="tag">Raíles de voltaje</div>Entran <b>12V</b> (rojo) a la placa por el ATX y el EPS12V. El VRM regula y reparte: <b>12V</b> hacia la etapa de potencia de la CPU, <b>5V</b> (amarillo) hacia la RAM, y <b>3,3V</b> (azul) hacia el chipset. <i>Simplificado con fines didácticos: en una placa real el VRM convierte esos 12V en el voltaje exacto de cada chip (p. ej. ~1,2V para el núcleo de la CPU).</i>',
    'data-ram': '<div class="tag">Datos</div>Este flujo representa la <b>señal digital</b> entre la CPU y los 4 slots DIMM de RAM que ves en la foto. No es electricidad visible real, sino la comunicación por el <b>bus de memoria</b>: bits viajando a gran velocidad.',
    'data-chipset': '<div class="tag">Datos</div>Aquí se muestra la comunicación entre la <b>CPU y el chipset (PCH)</b>, el disipador con el logo junto a los puertos <b>SATA</b>. El chipset reparte esa información hacia el almacenamiento y otros periféricos. Es tráfico de <b>datos</b>, no alimentación.',
    all: '<div class="tag">Vista completa</div>Se muestran a la vez la <b>alimentación</b> (naranja, gruesa) y los <b>datos</b> (cian, fina) sobre la placa real. Fíjate en la diferencia: la energía "empuja" el sistema, los datos "informan" al sistema.',
    reset: '<div class="tag">Info</div>Esta es una <b>Motherboard/b> real. Pulsa un botón para activar un flujo: pistas <b>gruesas naranjas</b> para la alimentación y pistas <b>finas cian</b> para los datos — no es lo mismo alimentar un componente que transmitir información.'
  };

  function setMode(mode){
    clearPulses();
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));

    const cpuBody = document.getElementById('zone-cpu');
    cpuBody.classList.remove('zone-active');

    const allTraceIds = [...powerPaths, ...ramPaths, ...chipsetPaths];

    showVoltLabels(false);
    setVoltageClasses(mode === 'voltage');

    if(mode === 'reset'){
      setTraceState(allTraceIds, null);
      blinkNodes(null);
      infoBox.classList.remove('power-mode');
      infoText.innerHTML = messages.reset;
      return;
    }

    if(mode === 'power'){
      setTraceState(powerPaths, 'active');
      setTraceState([...ramPaths, ...chipsetPaths], 'dim');
      powerPaths.forEach(id => makePulse(id, 'pulse-power', 2.2));
      cpuBody.classList.add('zone-active');
      blinkNodes('power');
      infoBox.classList.add('power-mode');
      infoText.innerHTML = messages.power;
    }

    if(mode === 'voltage'){
      setTraceState(powerPaths, 'active');
      setTraceState([...ramPaths, ...chipsetPaths], 'dim');
      v12Paths.forEach(id => makePulse(id, 'pulse-v12', 2.0));
      v5Paths.forEach(id => makePulse(id, 'pulse-v5', 2.0));
      v33Paths.forEach(id => makePulse(id, 'pulse-v33', 2.0));
      showVoltLabels(true);
      cpuBody.classList.add('zone-active');
      blinkNodes('voltage');
      infoBox.classList.add('power-mode');
      infoText.innerHTML = messages.voltage;
    }

    if(mode === 'data-ram'){
      setTraceState(ramPaths, 'active');
      setTraceState([...powerPaths, ...chipsetPaths], 'dim');
      ramPaths.forEach(id => makePulse(id, 'pulse-data', 1.1));
      cpuBody.classList.add('zone-active');
      blinkNodes('data-ram');
      infoBox.classList.remove('power-mode');
      infoText.innerHTML = messages['data-ram'];
    }

    if(mode === 'data-chipset'){
      setTraceState(chipsetPaths, 'active');
      setTraceState([...powerPaths, ...ramPaths], 'dim');
      chipsetPaths.forEach(id => makePulse(id, 'pulse-data', 1.1));
      cpuBody.classList.add('zone-active');
      blinkNodes('data-chipset');
      infoBox.classList.remove('power-mode');
      infoText.innerHTML = messages['data-chipset'];
    }

    if(mode === 'all'){
      setTraceState(powerPaths, 'active');
      setTraceState([...ramPaths, ...chipsetPaths], 'active');
      powerPaths.forEach(id => makePulse(id, 'pulse-power', 2.2));
      ramPaths.forEach(id => makePulse(id, 'pulse-data', 1.1));
      chipsetPaths.forEach(id => makePulse(id, 'pulse-data', 1.1));
      cpuBody.classList.add('zone-active');
      blinkNodes('power');
      infoBox.classList.remove('power-mode');
      infoText.innerHTML = messages.all;
    }
  }

  document.getElementById('controls').addEventListener('click', (e) => {
    const btn = e.target.closest('.mode-btn');
    if(!btn) return;
    setMode(btn.dataset.mode);
  });

  // initial state
  setMode('reset');
})();
