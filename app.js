      $(document).ready(function () {
        let habits = [];

        // Load habits from localStorage
        function loadHabits() {
          const stored = localStorage.getItem("habits");
          if (stored) {
            habits = JSON.parse(stored);
          }
          renderHabits();
          updateStats();
        }

        // Save habits to localStorage
        function saveHabits() {
          localStorage.setItem("habits", JSON.stringify(habits));
          updateStats();
        }

        // Get last 7 days
        function getLast7Days() {
          const days = [];
          for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.now() - i * 86400000);
            days.push({
              date: date.toISOString().split("T")[0],
              day: date.toLocaleDateString("en-US", { weekday: "short" }),
              isToday: i === 0,
            });
          }
          return days;
        }

        // Calculate streak
        function calculateStreak(completions) {
          if (!completions || completions.length === 0) return 0;

          const sorted = [...completions].sort().reverse();
          const today = new Date().toISOString().split("T")[0];
          const yesterday = new Date(Date.now() - 86400000)
            .toISOString()
            .split("T")[0];

          if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

          let streak = 0;
          let currentDate = new Date();

          for (let i = 0; i < 365; i++) {
            const dateStr = currentDate.toISOString().split("T")[0];
            if (sorted.includes(dateStr)) {
              streak++;
              currentDate = new Date(currentDate - 86400000);
            } else {
              break;
            }
          }

          return streak;
        }

        // Render calendar header
        function renderCalendarHeader() {
          const days = getLast7Days();
          const $header = $("#daysHeader");
          $header.empty();

          days.forEach((day) => {
            const $dayCol = $("<div>", { class: "day-col" });
            $dayCol.append(
              $("<div>", {
                class: "day-name" + (day.isToday ? " today" : ""),
                text: day.day,
              })
            );
            $dayCol.append(
              $("<div>", {
                class: "day-date",
                text: new Date(day.date).getDate(),
              })
            );
            $header.append($dayCol);
          });
        }

        // Render habits
        function renderHabits() {
          const $list = $("#habitsList");
          const $emptyState = $("#emptyState");

          if (habits.length === 0) {
            $emptyState.show();
            return;
          }

          $emptyState.hide();
          $list.find(".habit-card").remove();

          const days = getLast7Days();

          habits.forEach((habit) => {
            const streak = calculateStreak(habit.completions || []);
            const $card = $("<div>", {
              class: "habit-card",
              "data-habit-id": habit.id,
            });

            // Habit info
            const $info = $("<div>", { class: "habit-info" });
            $info.append(
              $("<div>", {
                class: "habit-name",
                text: habit.name,
              })
            );

            const $meta = $("<div>", { class: "habit-meta" });
            if (streak > 0) {
              $meta.append(
                $("<span>", {
                  class: "streak-badge",
                  html: "🔥 " + streak + " day" + (streak !== 1 ? "s" : ""),
                })
              );
            }
            $meta.append(
              $("<button>", {
                class: "delete-btn",
                html: "🗑️",
                "data-habit-id": habit.id,
              })
            );
            $info.append($meta);

            // Check boxes
            const $checks = $("<div>", { class: "habit-checks" });
            days.forEach((day) => {
              const isChecked =
                habit.completions && habit.completions.includes(day.date);
              const $check = $("<button>", {
                class:
                  "check-box" +
                  (isChecked ? " checked" : "") +
                  (day.isToday ? " today" : ""),
                "data-habit-id": habit.id,
                "data-date": day.date,
                html: isChecked ? "✓" : "",
              });
              $checks.append($check);
            });

            $card.append($info).append($checks);
            $list.append($card);
          });
        }

        // Update stats
        function updateStats() {
          $("#totalHabits").text(habits.length);
          const total = habits.reduce(
            (sum, h) => sum + (h.completions ? h.completions.length : 0),
            0
          );
          $("#totalCompletions").text(total);
        }

        // Toggle habit completion
        $(document).on("click", ".check-box", function () {
          const habitId = parseInt($(this).data("habit-id"));
          const date = $(this).data("date");

          const habit = habits.find((h) => h.id === habitId);
          if (!habit) return;

          if (!habit.completions) habit.completions = [];

          const index = habit.completions.indexOf(date);
          if (index > -1) {
            habit.completions.splice(index, 1);
            $(this).removeClass("checked").html("");
          } else {
            habit.completions.push(date);
            $(this).addClass("checked").html("✓");

            // Celebration animation
            $(this).addClass("celebrate");
            setTimeout(() => $(this).removeClass("celebrate"), 600);
          }

          saveHabits();
          renderHabits(); // Re-render to update streak
        });

        // Show add form
        $("#addHabitBtn").on("click", function () {
          $("#addForm").slideDown(200);
          $("#habitNameInput").focus();
        });

        // Cancel add form
        $("#cancelBtn").on("click", function () {
          $("#addForm").slideUp(200);
          $("#habitNameInput").val("");
        });

        // Save new habit
        $("#saveHabitBtn").on("click", function () {
          const name = $("#habitNameInput").val().trim();
          if (!name) return;

          const newHabit = {
            id: Date.now(),
            name: name,
            createdAt: new Date().toISOString(),
            completions: [],
          };

          habits.push(newHabit);
          saveHabits();
          renderHabits();

          $("#habitNameInput").val("");
          $("#addForm").slideUp(200);
        });

        // Handle enter key in input
        $("#habitNameInput").on("keypress", function (e) {
          if (e.which === 13) {
            $("#saveHabitBtn").click();
          }
        });

        // Delete habit
        $(document).on("click", ".delete-btn", function (e) {
          e.stopPropagation();
          const habitId = parseInt($(this).data("habit-id"));

          if (confirm("Delete this habit? This cannot be undone.")) {
            habits = habits.filter((h) => h.id !== habitId);
            saveHabits();
            renderHabits();
          }
        });

        // Export data
        $("#exportBtn").on("click", function () {
          const csv = ["Habit,Date,Completed"];
          habits.forEach((habit) => {
            if (habit.completions) {
              habit.completions.forEach((date) => {
                csv.push('"' + habit.name + '",' + date + ",true");
              });
            }
          });

          const blob = new Blob([csv.join("\n")], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download =
            "habits-" + new Date().toISOString().split("T")[0] + ".csv";
          a.click();
          URL.revokeObjectURL(url);
        });

        // Import data
        $("#importBtn").on("click", function () {
          $("#importFile").click();
        });

        $("#importFile").on("change", function (e) {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = function (event) {
            const text = event.target.result;
            const lines = text.split("\n").slice(1);
            const importedHabits = {};

            lines.forEach((line) => {
              if (!line.trim()) return;
              const match = line.match(/"([^"]+)",([^,]+)/);
              if (!match) return;

              const name = match[1];
              const date = match[2];

              if (!importedHabits[name]) {
                importedHabits[name] = {
                  id: Date.now() + Math.random(),
                  name: name,
                  createdAt: new Date().toISOString(),
                  completions: [],
                };
              }

              if (date) {
                importedHabits[name].completions.push(date.trim());
              }
            });

            habits = habits.concat(Object.values(importedHabits));
            saveHabits();
            renderHabits();
          };

          reader.readAsText(file);
          $(this).val("");
        });

        // Initialize
        renderCalendarHeader();
        loadHabits();

        // Set current year
        $("#currentYear").text(new Date().getFullYear());
      });
