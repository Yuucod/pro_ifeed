document.addEventListener('DOMContentLoaded', () => {
    const editButton = document.getElementById('editProfileBtn');
    const editForm = document.getElementById('personalEditForm');
    const cancelEditButton = document.getElementById('cancelEditBtn');

    if (editButton && editForm) {
        editButton.addEventListener('click', () => {
            editForm.hidden = false;
            editButton.hidden = true;
            editForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    if (cancelEditButton && editForm && editButton) {
        cancelEditButton.addEventListener('click', () => {
            editForm.hidden = true;
            editButton.hidden = false;
        });
    }

    if (editForm && editForm.querySelector('.errorlist')) {
        editForm.hidden = false;
        if (editButton) editButton.hidden = true;
    }
});
