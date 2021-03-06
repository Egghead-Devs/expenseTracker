var Role = require('../../models/role');
var models = require('../../models');
const { check, validationResult } = require('express-validator');


// CREATE ROLE.
exports.role_create_post = [
    [
        // Validation for inputs
        check('role_name')
        .isLength({
            min: 3,
            max: 50
        }).withMessage('Role name must be between 3 and 50 characters long')
        .not().isEmpty().withMessage('Role name cannot be empty')
        .matches(/^[A-Za-z\s]+$/).withMessage('Role name must contain only Letters.'),
        check('current_business')
        .not().isEmpty().withMessage('CurrentBusinessId cannot be empty')
        .isInt().withMessage('CurrentBusinessId must be numeric'),
    ],
    function(req, res, next) {
        // checks for validations
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                status: false,
                errors: errors.array()
            });
        }
        try {
            models.Role.create({
                role_name: req.body.role_name,
                CurrentBusinessId: req.body.current_business
            }).then(function(role) {
                res.status(200).json({
                    status: true,
                    data: role,
                    message: 'Role created successfully'
                })
                console.log("Role created successfully");
            });
        } catch (error) {
            // check if there was an error during operation
            res.status(400).json({
                status: false,
                message: `There was an error - ${error}`
            });
        }
    }
];

// DELETE ROLE.
exports.role_delete_post = async function(req, res, next) {
    var role_id = req.params.role_id
    if (isNaN(Number(role_id))) {
        return res.status(400).json({
            status: false,
            message: 'Invalid Role ID'
        });
    }
    // checks if the ID exists
    const thisRole = await models.Role.findById(role_id)
    if (!thisRole) {
        return res.status(400).json({
            status: false,
            message: 'Role ID not found'
        });
    }
    // Performs operation
    try {
        models.Role.destroy({
            where: {
                id: role_id
            }
        }).then(function() {
            res.status(200).json({
                status: true,
                message: 'Role deleted successfully'
            })
            console.log("Role deleted successfully");
        });
    } catch (error) {
        // check if there was an error during operation
        res.status(400).json({
            status: false,
            message: `There was an error - ${error}`
        });
    }
};

// LIST ALL ROLES.
exports.role_list = function(req, res, next) {
    try {
        models.Role.findAll({
            where: {
                CurrentBusinessId: req.user.CurrentBusinessId,
            }
        }).then(function(roles) {
            if (roles.length === 0) {
                res.json({
                    status: false,
                    data: 'None',
                    message: 'No Roles available'
                })
            } else {
                res.json({
                    status: true,
                    data: roles,
                    message: 'Roles Listed successfully'
                })
            }
            console.log("Roles list renders successfully");
        });
    } catch (error) {
        // check if there was an error during operation
        res.status(400).json({
            status: false,
            message: `There was an error - ${error}`
        });
    }
};

// READ ONE ROLE.
exports.role_detail = async function(req, res, next) {
    var role_id = req.params.role_id
    if (isNaN(Number(role_id))) {
        return res.status(400).json({
            status: false,
            message: 'Invalid Role ID'
        });
    }
    // checks if the ID exists
    const thisRole = await models.Role.findById(role_id)
    if (!thisRole) {
        return res.status(400).json({
            status: false,
            message: 'Role ID not found'
        });
    }
    // Performs operation
    try {
        models.Role.findById(
            role_id, {
                include: [{
                    model: models.user,
                    attributes: ['id', 'firstname', 'lastname', 'email', 'name', 'RoleId', 'DepartmentId'],
                    include: [{
                            model: models.Department,
                        },
                        {
                            model: models.Role,
                        },
                    ],
                }, ],
            }
        ).then(function(role) {
            // renders an inividual role details page
            if (!role) {
                res.status(400).json({
                    status: false,
                    data: 'None',
                    message: 'Role not found'
                });
            } else {
                res.status(200).json({
                    status: true,
                    data: role,
                    message: 'Role details rendered successfully'
                });
            }
            console.log("Role detials renders successfully");
        });
    } catch (error) {
        // check if there was an error during operation
        res.status(400).json({
            status: false,
            message: `There was an error - ${error}`
        });
    }
};

 