const deleteProduct = (btn) =>{
    const prodId = btn.parentNode.querySelector('[name=productId]').value
    const csrf = btn.parentNode.querySelector('[name=_csrf').value

    const productElement = btn.closest('article')

    // used to send and receive http requests from client side javascript and is provided by browser
    fetch('/admin/product/'+prodId, {
        method: 'DELETE',
        headers: {
            // to send csrfToken along with the delete request
            'csrf-token': csrf  // the csurf package looks for 'csrf-token' name in headers
        }
    })
        .then(result =>{
            // console.log(result)
            // to extract the json sent with the response after deleting the product
            return result.json()    //is a promise
        })
        .then(data =>{
            console.log(data)
            // productElement.remove()      is not supported in Internet Explorer

            productElement.parentNode.removeChild(productElement)
        })
        .catch(err =>{
            console.log(err)
        })

}