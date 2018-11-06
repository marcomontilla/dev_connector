const express = require('express')
const router = express.Router()
const passport = require('passport')
const mongoose = require('mongoose')

// Load Models
const Post = require('../../models/Post')
const Profile = require('../../models/Profile')

// Load Input Validation
const validatePostInput = require('../../validation/post')

/**
 * @route  	GET api/posts/test
 * @desc   	Test post route
 * @access 	Public
 */
router.get('/test', (req, res) => res.json({ msg: 'Posts Works' }))

/**
 * @route  	GET api/posts
 * @desc   	Get post
 * @access 	Public
 */
router.get('/', (req, res) => {
	Post.find()
		.sort({ date: -1 })
		.then(posts => res.json(posts))
		.catch(err => res.status(404).json({ err, nopostfound: 'No post found' }))
})

/**
 * @route  	GET api/posts/:id
 * @desc   	Get post by ID
 * @access 	Public
 */
router.get('/:id', (req, res) => {
	Post.findById(req.params.id)
		.then(posts => res.json(posts))
		.catch(err => res.status(404).json({ err, nopostfound: 'No post found' }))
})

/**
 * @route  	POST api/posts
 * @desc   	Create post
 * @access 	Private
 */
router.post(
	'/',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const { errors, isValid } = validatePostInput(req.body)

		// Check Validations
		if (!isValid) {
			return res.status(400).json(errors)
		}

		const newPost = new Post({
			text: req.body.text,
			name: req.body.name,
			avatar: req.body.name,
			user: req.user.id,
		})

		newPost.save().then(post => res.json(post))
	}
)

/**
 * @route  	Delete api/posts/:id
 * @desc   	Delete post by id
 * @access 	Private
 */
router.delete(
	'/:id',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Profile.findOne({ user: req.user.id }).then(post => {
			Post.findById(req.params.id)
				.then(post => {
					// Check for post owner
					if (post.user.toString() !== req.user.id) {
						return res
							.status(401)
							.json({ notauthorized: 'User not authorized' })
					}

					post.remove().then(() => res.json({ success: true }))
				})
				.catch(err =>
					res.status(404).json({ err, nopostfound: 'No post found' })
				)
		})
	}
)

/**
 * @route  	POST api/posts/like/:id
 * @desc   	Like post
 * @access 	Private
 */
router.post(
	'/like/:id',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Profile.findOne({ user: req.user.id }).then(post => {
			Post.findById(req.params.id)
				.then(post => {
					if (
						post.likes.filter(like => like.user.toString() === req.user.id)
							.length > 0
					) {
						res
							.status(400)
							.json({ alreadyliked: 'User already liked this post' })
					}

					// Add user id to likes array
					post.likes.unshift({ user: req.user.id })

					post.save().then(post => res.json(post))
				})
				.catch(err =>
					res.status(404).json({ err, nopostfound: 'No post found' })
				)
		})
	}
)

module.exports = router
