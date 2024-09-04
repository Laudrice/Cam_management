 const userController = require('../controllers/userController.js')
 const router = require('express').Router()

 //Get
 router.get('/allUsers', userController.getAllUsers)
 
 router.get('/:id', userController.getOneUser)
 

 //Post
 router.post('/addUser', userController.addUser);
 
 router.post('/login', userController.loginUser)
 
 router.post('/logout', userController.logoutUser);
 

 //Put
 router.put('/:id', userController.updateUser)
 

 //Delete
 router.delete('/:id', userController.deleteUser)


 module.exports = router