var $ = function (sel) {
    return document.querySelector(sel);
};
var $All = function (sel) {
    return document.querySelectorAll(sel);
};
var makeArray = function (likeArray) {
    var array = [];
    for (var i = 0; i < likeArray.length; ++i) {
        array.push(likeArray[i]);
    }
    return array;
};
var guid = 0;
var CL_COMPLETED = 'completed';
var CL_SELECTED = 'selected';
var CL_EDITING = 'editing';
var hammer;

window.onload = function () {
    model.init(function () {
        var data = model.data;

        var newTodo = $('.new-todo');
        newTodo.addEventListener('keyup', function () {
            data.msg = newTodo.value;
        });
        newTodo.addEventListener('change', function () {
            model.flush();
        });
        newTodo.addEventListener('keyup', function (ev) {
            if (ev.keyCode != 13) return; // Enter

            if (data.msg == '' || data.msg.match(/^[ ]+$/)) { //avoid empty content
                console.warn('input msg is empty');
                return;
            }
            data.items.push({msg: data.msg, completed: false});
            data.msg = '';
            update();
        }, false);

        var clearCompleted = $('.clear-completed');
        hammer = new Hammer(clearCompleted);
        hammer.on('tap', function () {
            for (var i = data.items.length - 1; i >= 0; --i) {
                if (data.items[i].completed) data.items.splice(i, 1);
            }
            // data.items.forEach(function (itemData, index) {
            //     if (itemData.completed) data.items.splice(index, 1);
            // });
            update();
        });

        var toggleAll = $('.toggle-all');
        toggleAll.addEventListener('change', function () {
            var completed = toggleAll.checked;
            data.items.forEach(function (itemData) {
                itemData.completed = completed;
            });
            update();
        }, false);

        var filters = makeArray($All('.filters div a'));
        filters.forEach(function (filter) {
            hammer = new Hammer(filter);
            hammer.on('tap', function () {
                data.filter = filter.innerHTML;
                filters.forEach(function (filter) {
                    filter.classList.remove(CL_SELECTED);
                });
                filter.classList.add(CL_SELECTED);
                update();
            })
        });

        update();
    });
};


function update() {
    model.flush();
    var data = model.data;

    var activeCount = 0;
    var todoList = $('.todo-list');
    todoList.innerHTML = '';
    data.items.forEach(function (itemData, index) {
        if (!itemData.completed) activeCount++;
        if (
            data.filter == 'All'
            || (data.filter == 'Active' && !itemData.completed)
            || (data.filter == 'Completed' && itemData.completed)
        ) {
            var item = document.createElement('li');
            var id = 'item' + guid++;
            item.setAttribute('id', id);
            if (itemData.completed) item.classList.add(CL_COMPLETED);
            item.innerHTML = [
                '<div class="view">',
                '  <div class="toggle-border">',
                '  <input class="toggle" type="checkbox">',
                '  </div>',
                '  <label class="todo-label">' + itemData.msg + '</label>',
                // '  <button class="destroy"></button>',
                '</div>'
            ].join('');

            var label = item.querySelector('.todo-label');
            hammer = new Hammer(label);
            hammer.on('press', function () {
                item.classList.add(CL_EDITING);

                var edit = document.createElement('input');
                var finished = false;
                edit.setAttribute('type', 'text');
                edit.setAttribute('class', 'edit');
                edit.setAttribute('value', label.innerHTML);

                function finish() {
                    if (finished) return;
                    finished = true;
                    item.removeChild(edit);
                    item.classList.remove(CL_EDITING);
                }

                edit.addEventListener('blur', function () {
                    finish();
                }, false);

                edit.addEventListener('keyup', function (ev) {
                    if (ev.keyCode == 27) { // Esc
                        finish();
                    }
                    else if (ev.keyCode == 13) {
                        label.innerHTML = this.value;
                        itemData.msg = this.value;
                        update();
                    }
                }, false);

                item.appendChild(edit);
                edit.focus();
            });

            hammer.on('swipeleft', function () {
                data.items.splice(index, 1);
                console.log(hammer.element);
                update();
            });

            var itemToggle = item.querySelector('.toggle');
            itemToggle.checked = itemData.completed;
            itemToggle.addEventListener('change', function () {
                itemData.completed = !itemData.completed;
                update();
            }, false);

            // var itemDestroy = item.querySelector('.destroy');
            // hammer = new Hammer(itemDestroy);
            // hammer.on('tap',function() {
            //   console.log(itemDestroy);
            //   data.items.splice(index, 1);
            //   update();
            // });

            todoList.insertBefore(item, todoList.firstChild);
        }
    });

    var newTodo = $('.new-todo');
    newTodo.value = data.msg;

    var completedCount = data.items.length - activeCount;
    var count = $('.todo-count');
    count.innerHTML = (activeCount || 'No') + (activeCount > 1 ? ' items' : ' item') + ' left';

    var clearCompleted = $('.clear-completed');
    clearCompleted.style.visibility = completedCount > 0 ? 'visible' : 'hidden';

    var toggleAll = $('.toggle-all');
    toggleAll.style.visibility = data.items.length > 0 ? 'visible' : 'hidden';
    toggleAll.checked = data.items.length == completedCount;

    var filters = makeArray($All('.filters div a'));
    filters.forEach(function (filter) {
        if (data.filter == filter.innerHTML) filter.classList.add(CL_SELECTED);
        else filter.classList.remove(CL_SELECTED);
    });
}