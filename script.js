const STORAGE_KEY = "taskflow_tasks";
let tasks = loadTasks();
let draggedId = null;

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved.filter(task =>
      task && Number.isFinite(task.id) &&
      typeof task.title === "string" &&
      ["todo", "progress", "done"].includes(task.status)
    ) : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function openModal() {
  document.getElementById("modal").style.display = "flex";
  document.getElementById("taskTitle").focus();
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

function addTask(event) {
  event.preventDefault();
  const title = document.getElementById("taskTitle").value.trim();
  const description = document.getElementById("taskDescription").value.trim();
  const status = document.getElementById("taskStatus").value;
  if (!title) return;

  tasks.push({ id: Date.now(), title, description, status });
  saveTasks();
  render();
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDescription").value = "";
  document.getElementById("taskStatus").value = "todo";
  closeModal();
}

function deleteTask(id) {
  if (!confirm("Удалить эту задачу?")) return;
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  render();
}

function moveTask(id, status) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;
  task.status = status;
  saveTasks();
  render();
}

function createCard(task) {
  const card = document.createElement("article");
  card.className = "task";
  card.draggable = true;

  const title = document.createElement("strong");
  title.textContent = task.title;

  const description = document.createElement("p");
  description.textContent = task.description || "Без описания";

  const number = document.createElement("small");
  number.textContent = "Задача #" + String(task.id).slice(-5);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const statusSelect = document.createElement("select");
  [["todo", "Новые"], ["progress", "В процессе"], ["done", "Готово"]]
    .forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      statusSelect.appendChild(option);
    });
  statusSelect.value = task.status;
  statusSelect.setAttribute("aria-label", "Изменить статус задачи");
  statusSelect.addEventListener("change", () => moveTask(task.id, statusSelect.value));

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Удалить";
  deleteButton.className = "delete";
  deleteButton.addEventListener("click", () => deleteTask(task.id));

  actions.append(statusSelect, deleteButton);
  card.append(title, description, number, actions);

  card.addEventListener("dragstart", () => {
    draggedId = task.id;
    card.classList.add("dragging");
  });
  card.addEventListener("dragend", () => {
    draggedId = null;
    card.classList.remove("dragging");
  });

  return card;
}

function render() {
  const lists = {
    todo: document.getElementById("todo"),
    progress: document.getElementById("progress-list"),
    done: document.getElementById("done-list")
  };
  const counts = { todo: 0, progress: 0, done: 0 };

  Object.values(lists).forEach(list => list.replaceChildren());

  tasks.forEach(task => {
    if (!lists[task.status]) return;
    counts[task.status]++;
    lists[task.status].appendChild(createCard(task));
  });

  Object.keys(lists).forEach(status => {
    if (counts[status] === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "Пока нет задач";
      lists[status].appendChild(empty);
    }
  });

  document.getElementById("total").textContent = tasks.length;
  document.getElementById("progress").textContent = counts.progress;
  document.getElementById("done").textContent = counts.done;
  document.getElementById("count-todo").textContent = counts.todo;
  document.getElementById("count-progress").textContent = counts.progress;
  document.getElementById("count-done").textContent = counts.done;
}

document.querySelectorAll(".column").forEach(column => {
  column.addEventListener("dragover", event => {
    event.preventDefault();
    column.classList.add("drag-over");
  });
  column.addEventListener("dragleave", event => {
    if (!column.contains(event.relatedTarget)) column.classList.remove("drag-over");
  });
  column.addEventListener("drop", event => {
    event.preventDefault();
    column.classList.remove("drag-over");
    if (draggedId !== null) moveTask(draggedId, column.dataset.status);
  });
});

document.getElementById("modal").addEventListener("click", event => {
  if (event.target.id === "modal") closeModal();
});

render();
