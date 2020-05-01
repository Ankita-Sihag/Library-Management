const deleteBook = (btn) => {
    const bookId = btn.parentNode.querySelector('[name=bookId').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf').value;
    
    const bookElement = btn.closest('article');

    fetch('/admin/book/'+ bookId, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
        }
    })
    .then(result => {
        return result.json();
    })
    .then(data => {
        bookElement.parentNode.removeChild(bookElement);
    })
    .catch(err => {
        console.log(err);
    });

}