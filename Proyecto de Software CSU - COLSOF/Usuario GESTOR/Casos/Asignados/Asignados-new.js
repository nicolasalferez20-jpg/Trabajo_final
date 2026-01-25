const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3001/api'
  : '/api'

let cases = []
let technicians = []
let selectedTechnician = 'all'
let selectedCase = null
let autoRefreshTimer = null

const qs = (sel, ctx = document) => ctx.querySelector(sel)
const qsa = (sel, ctx = document) => ctx.querySelectorAll(sel)
const normalize = (val = '') => String(val || '').toLowerCase()

const formatCaseId = (id) => `#${String(id ?? '').padStart(8, '0')}`

const isAssigned = (item) => {
  const tecnico = normalize(item.asignado_a || item.tecnico_asignado || '')
  return tecnico && tecnico !== 'sin asignar'
}

const formatDate = (value) => {
  if (!value) return 'Sin fecha'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

const showToast = (msg, isError = false) => {
  let box = document.getElementById('assigned-toast')
  if (!box) {
    box = document.createElement('div')
    box.id = 'assigned-toast'
    box.style.position = 'fixed'
    box.style.right = '20px'
    box.style.bottom = '20px'
    box.style.padding = '12px 16px'
    box.style.borderRadius = '8px'
    box.style.boxShadow = '0 10px 30px rgba(0,0,0,0.12)'
    box.style.zIndex = '9999'
    box.style.fontWeight = '600'
    document.body.appendChild(box)
  }
  box.textContent = msg
  box.style.background = isError ? '#fee2e2' : '#d1fae5'
  box.style.color = isError ? '#991b1b' : '#065f46'
  clearTimeout(box._timer)
  box._timer = setTimeout(() => box.remove(), 2400)
}

const mapCase = (item) => {
  return {
    id: item.id,
    formattedId: `#${String(item.id).padStart(8, '0')}`,
    title: item.descripcion || 'Caso sin titulo',
    technician: item.asignado_a || 'Sin asignar',
    client: item.cliente || 'Sin cliente',
    category: item.categoria || 'Sin categoria',
    priority: item.prioridad || 'Media',
    status: item.estado || 'Pendiente',
    deadline: formatDate(item.fecha_creacion),
    description: item.descripcion || 'Sin descripcion',
    type: item.tipo || 'Soporte'
  }
}

const buildTechnicians = () => {
  const techMap = new Map()

  cases.forEach((c) => {
    const key = c.technician
    if (!techMap.has(key)) {
      const initials = key
        .split(' ')
        .map((w) => w.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
      techMap.set(key, { name: key, avatar: initials, activeCount: 0 })
    }
    techMap.get(key).activeCount++
  })

  technicians = Array.from(techMap.values()).sort((a, b) => b.activeCount - a.activeCount)
}

const updateMetrics = (filtered = cases) => {
  const enProgreso = filtered.filter((c) => normalize(c.status).includes('progreso')).length
  const pendientes = filtered.filter((c) => normalize(c.status) === 'pendiente').length
  const urgentes = filtered.filter((c) => normalize(c.priority) === 'alta').length
  const programados = filtered.filter((c) => normalize(c.status).includes('programado')).length

  qs('#kpiProgress').textContent = enProgreso || '0'
  qs('#kpiPending').textContent = pendientes || '0'
  qs('#kpiUrgent').textContent = urgentes || '0'
  qs('#kpiScheduled').textContent = programados || '0'
  qs('#totalCases').textContent = filtered.length || '0'
}

const renderTable = (filtered = cases) => {
  const tbody = qs('#casesTable')
  if (!tbody) return

  if (filtered.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #7b8694;">No hay casos asignados</td></tr>'
    return
  }

  tbody.innerHTML = filtered
    .map(
      (c) => `
    <tr onclick="openModal('${c.id}')">
      <td><strong>${c.formattedId}</strong><br>${c.title.substring(0, 30)}</td>
      <td>${c.technician}</td>
      <td>${c.client}</td>
      <td>${c.category}</td>
      <td><span style="background: ${getPriorityColor(c.priority)}; padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px;">${c.priority}</span></td>
      <td><span style="background: ${getStatusColor(c.status)}; padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px;">${c.status}</span></td>
      <td>${c.deadline}</td>
      <td><button onclick="event.stopPropagation(); reassign('${c.id}')" style="padding: 4px 8px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">...</button></td>
    </tr>
  `
    )
    .join('')
}

const getPriorityColor = (priority) => {
  const p = normalize(priority)
  if (p === 'alta') return '#dc2626'
  if (p === 'media') return '#f97316'
  return '#10b981'
}

const getStatusColor = (status) => {
  const s = normalize(status)
  if (s.includes('abierto') || s.includes('pendiente')) return '#06b6d4'
  if (s.includes('progreso')) return '#f59e0b'
  if (s.includes('resuelto')) return '#10b981'
  return '#6b7280'
}

const render = () => {
  updateMetrics()
  renderTable()
  renderTechnicians()
}

const renderTechnicians = () => {
  const section = qs('#technicians')
  if (!section) return

  section.innerHTML = technicians
    .map(
      (t) => `
    <div style="margin-bottom: 16px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
        <div style="width: 32px; height: 32px; background: #1976d2; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">${t.avatar}</div>
        <h3 style="margin: 0;">${t.name}</h3>
        <span style="background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${t.activeCount} casos</span>
      </div>
    </div>
  `
    )
    .join('')
}

const openModal = (id) => {
  selectedCase = cases.find((c) => c.id === id)
  if (!selectedCase) return

  const modal = qs('#modal')
  const modalId = qs('#modalId')
  const modalBody = qs('#modalBody')

  modalId.textContent = selectedCase.formattedId
  modalBody.innerHTML = `
    <div style="padding: 16px; border: 1px solid #ebedf2; border-radius: 8px;">
      <p><strong>Cliente:</strong> ${selectedCase.client}</p>
      <p><strong>Técnico:</strong> ${selectedCase.technician}</p>
      <p><strong>Categoría:</strong> ${selectedCase.category}</p>
      <p><strong>Prioridad:</strong> ${selectedCase.priority}</p>
      <p><strong>Estado:</strong> ${selectedCase.status}</p>
      <p><strong>Tipo:</strong> ${selectedCase.type}</p>
      <p><strong>Descripción:</strong> ${selectedCase.description}</p>
    </div>
  `

  modal.classList.remove('hidden')
}

const closeModal = () => {
  const modal = qs('#modal')
  if (modal) modal.classList.add('hidden')
}

const reassign = (id) => {
  alert('Reasignación disponible próximamente')
}

const setupSearch = () => {
  const input = qs('.search input')
  if (!input) return

  input.addEventListener('input', (e) => {
    const query = normalize(e.target.value)
    if (!query) {
      render()
      return
    }

    const filtered = cases.filter(
      (c) =>
        normalize(c.id).includes(query) ||
        normalize(c.title).includes(query) ||
        normalize(c.client).includes(query) ||
        normalize(c.technician).includes(query) ||
        normalize(c.category).includes(query)
    )

    updateMetrics(filtered)
    renderTable(filtered)
  })
}

const fetchAssigned = async () => {
  try {
    console.log('🔄 Cargando casos asignados...')
    const res = await fetch(`${API_URL}/casos?asignado_a=*`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'API error')

    const filtered = Array.isArray(data.data) ? data.data.filter(isAssigned) : []
    cases = filtered.map(mapCase)
    buildTechnicians()
    render()
    console.log(`✅ ${cases.length} casos cargados`)
    showToast(`${cases.length} casos asignados cargados`)
  } catch (err) {
    console.error('❌ Error al cargar casos asignados:', err)
    showToast('No se pudieron cargar los casos. Verifica la conexión.', true)
  }
}

const startAutoRefresh = () => {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer)
  autoRefreshTimer = setInterval(fetchAssigned, 30000)
}

window.openModal = openModal
window.closeModal = closeModal
window.reassign = reassign

document.addEventListener('DOMContentLoaded', () => {
  setupSearch()
  fetchAssigned()
  startAutoRefresh()
})
