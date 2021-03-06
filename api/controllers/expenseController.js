var Expense = require('../../models/expense');
var models = require('../../models');
const moment = require('moment');
const { Op } = require('sequelize')
const { check, validationResult } = require('express-validator');
var checkParamsId = require('../../helpers/checkParams');
var checkExpenseStatus = require('../../helpers/checkExpenseStatus');


// CREATE EXPENSE.
exports.expense_create_post = [

    [
        // Validation for inputs
        check('title')
        .not().isEmpty().withMessage('Expense title cannot be empty')
        .isLength({
            min: 3,
            max: 50
        }).withMessage('Expense title must be between 3 and 50 characters long')
        .matches(/^[A-Za-z\s]+$/).withMessage('Expense title must contain only Letters.'),
        check('desc')
        .isLength({
            min: 3,
            max: 200
        }).withMessage('Expense description must be between 3 and 200 characters long')
        .not().isEmpty().withMessage('Expense description cannot be empty'),
        check('amount')
        .isLength({
            min: 3,
            max: 50
        }).withMessage('Expense amount must be greater than N100')
        .not().isEmpty().withMessage('Expense amount cannot be empty')
        .isInt().withMessage('Expense amount must be numeric'),
        check('type')
        .not().isEmpty().withMessage('Please select expense type'),
        check('category')
        .not().isEmpty().withMessage('Please select expense category'),
        check('employee_id')
        .not().isEmpty().withMessage('This expense must be created by an authenticated employee'),
        check('reviewer')
        .not().isEmpty().withMessage('Please select a reviewer'),
        check('department')
        .not().isEmpty().withMessage('This expense must belong to an exsisting department'),
        check('current_business')
        .not().isEmpty().withMessage('This expense must belong to an employee business'),
    ],


    async function(req, res, next) {
        // checks for validations
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                status: false,
                errors: errors.array()
            });
        }

        try {
            
            // put default pending in model
            var status;
            status = (req.body.amount <= 1000) ? 'Approved' : 'Pending';
            
            if (status == 'Approved') {
                var reviewer = 'Auto' 
            } else {
                var reviewer = null
            }
            
            // var reviewer = status == 'Approved' ? 'Auto' : null

            let employee_id = req.body.employee_id;

            const employee = await models.user.findById(employee_id);

            // If the category selected in the front end does not exist in DB return 400 error	
            if (!employee) {
                return res.status(400).json({
                    status: false,
                    message: 'Employee does not exist'
                });
            }

            var expense = {
                title: req.body.title,
                desc: req.body.desc,
                amount: req.body.amount,
                TypeId: req.body.type,
                CategoryId: req.body.category,
                status: status,
                reviewer: reviewer,
                CurrentBusinessId: req.body.current_business,
                userId: employee_id,
                ReviewerId: req.body.reviewer,
                DepartmentId: req.body.department
            }

            models.Expense.create(expense).then(function(expense) {
                res.status(200).json({
                    status: true,
                    data: expense,
                    message: 'Expense created successfully'
                })
                console.log("Expense created successfully");
            });
        } catch (error) {
            res.status(400).json({
                status: false,
                message: `There was an error - ${error}`
            });
        }

    }
];

// UPDATE EXPENSE.
exports.expense_update_post = [
    [
        // Validation for inputs
        check('title')
        .isLength({
            min: 3,
            max: 50
        }).withMessage('Expense title must be between 3 and 50 characters long')
        .not().isEmpty().withMessage('Expense title cannot be empty')
        .matches(/^[A-Za-z\s]+$/).withMessage('Expense title must contain only Letters.'),
        check('desc')
        .isLength({
            min: 3,
            max: 200
        }).withMessage('Expense description must be between 3 and 200 characters long')
        .not().isEmpty().withMessage('Expense description cannot be empty')
        .optional({
            checkFalsy: true
        }),
        check('amount')
        .isLength({
            min: 3,
            max: 50
        }).withMessage('Expense amount must be greater than N100')
        .not().isEmpty().withMessage('Expense amount cannot be empty')
        .isNumeric().withMessage('Express amount must be numeric')
        .optional({
            checkFalsy: true
        }),
        check('type')
        .not().isEmpty().withMessage('Please select expense type')
        .optional({
            checkFalsy: true
        }),
        check('category')
        .not().isEmpty().withMessage('Please select expense category')
        .optional({
            checkFalsy: true
        }),
    ],
    async function(req, res, next) {
        // checks for validations
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                status: false,
                errors: errors.array()
            });
        }
        // validates if the params ID is an integer
        var expense_id = await checkParamsId(req, res, 'Expense', req.params.expense_id);
        // Performs operation
        try {
            // checks if the ID exists
            var thisExpense = expense_id ? await models.Expense.findById(expense_id) : null
            if (!thisExpense) {
                return res.status(400).json({
                    status: false,
                    message: 'Expense ID not found'
                });
            }

            // var status;

            // status = (req.body.amount <= 1000) ? 'Approved' : 'Pending';

            var expense = {
                title: req.body.title ? req.body.title : thisExpense.title,
                desc: req.body.desc ? req.body.desc : thisExpense.desc,
                amount: req.body.amount ? req.body.amount : thisExpense.amount,
                TypeId: req.body.type ? req.body.type : thisExpense.type,
                CategoryId: req.body.category ? req.body.category : thisExpense.category,
            }
            console.log('this is the expense status '  + thisExpense.status);
            console.log('this is the expense amount '  + thisExpense.amount);
            
            var reviewed = await checkExpenseStatus(req, res, thisExpense.status);
            console.log('this is the status'+ reviewed);
            if (reviewed) {
                if (thisExpense.userId == req.user.id) {
                    models.Expense.update(
                        expense, {
                            where: {
                                id: expense_id
                            }
                        }
                    ).then(function(expense) {
                        if(!expense) {
                            res.status(404).json({
                                status: false,
                                data: 'None',
                                message: 'Expense not updated'
                            })
                        } else {
                            res.status(200).json({
                                status: true,
                                data: expense,
                                message: 'Expense updated successfully'
                            })
                            console.log("Expense updated successfully");
                        }
                    });
                } else {
                    return res.status(401).json({
                        status: false,
                        message: 'Operation Declined! You dont have the permission to perform this operation'
                    });
                }
            }
            
        } catch (error) {
            res.status(400).json({
                status: false,
                message: `There was an error - ${error}`
            });
        }

    }
];

// DELETE EXPENSE.
exports.expense_delete_post = async function(req, res, next) {
    // validates if the department ID is an integer
    var expense_id = await checkParamsId(req, res, 'Expense', req.params.expense_id);
    

    // Performs operation
    try {

        // checks if the ID exists
        var thisExpense = expense_id ? await models.Expense.findById(expense_id) : null

        if (!thisExpense) {
            return res.status(401).json({
                status: false,
                message: 'Expense ID not found'
            });
        }
        
        var reviewed = await checkExpenseStatus(req, res, thisExpense.status);
        if (reviewed) {
            // checks if the user is the owner of the expense or is a manger of the department
            if (thisExpense.DepartmentId == req.user.DepartmentId) {
                if (thisExpense.userId == req.user.id || req.user.Role.role_name == 'Manager') {
                    models.Expense.destroy({
                        where: {
                            id: expense_id
                        }
                    }).then(function() {
                        res.status(200).json({
                            status: true,
                            message: 'Expense Deleted Successfully'
                        })
                        console.log("Expense deleted successfully");
                    });
                } else {
                    return res.status(401).json({
                        status: false,
                        message: 'Operation Declined! You dont have the permission to perform this operation'
                    });
                }
            } else {
                return res.status(401).json({
                    status: false,
                    message: 'Operation Declined! You dont belong to the department under which this expense was created.'
                });
            }
        }
        
    } catch (error) {
        res.status(400).json({
            status: false,
            message: `There was an error - ${error}`
        });
    }
};

// READ ONE EXPENSE.
exports.expense_detail = async function(req, res, next) {
    // validates if the params ID is an integer
    var expense_id = await checkParamsId(req, res, 'Expense', req.params.expense_id);
    // Performs operation
    try {
        // checks if the ID exists
        var thisExpense = expense_id ? await models.Expense.findById(expense_id) : null
        if (!thisExpense) {
            return res.status(400).json({
                status: false,
                message: 'Expense ID not found'
            });
        }

        models.Expense.findById(
            expense_id, {
                include: [{
                        model: models.user,
                        as: 'user',
                        attributes: ['id', 'firstname', 'lastname', 'name']
                    },
                    {
                        model: models.Category,
                        attributes: ['id', 'category_name']
                    },
                    {
                        model: models.Type,
                        attributes: ['id', 'type_name']
                    },
                    {
                        model: models.Department,
                        attributes: ['id', 'dept_name']
                    },

                ]
            }
        ).then(function(expense) {
            // renders an inividual post details page
            if (!expense) {
                res.status(400).json({
                    status: false,
                    data: 'None',
                    message: 'Expense not found'
                });
            } else {
                res.json({
                    status: true,
                    data: expense,
                    message: 'Expense details rendered successfully'
                });
            }
            console.log("Expense details renders successfully");
        });
    } catch (error) {
        res.status(400).json({
            status: false,
            message: `There was an error - ${error}`
        });
    }

};

// LIST ALL EXPENSES.
exports.expense_list = function(req, res, next) {
    try {
        models.Expense.findAll({
            where: {
                CurrentBusinessId: req.user.CurrentBusinessId,
                DepartmentId: req.user.DepartmentId
            },
            order: [
                ['id', 'DESC'],
            ],
            include: [{
                    model: models.user,
                    attributes: ['id', 'firstname', 'lastname', 'name']
                },
                {
                    model: models.Category,
                    attributes: ['id', 'category_name']
                },
                {
                    model: models.Type,
                    attributes: ['id', 'type_name']
                },
                {
                    model: models.Department,
                    attributes: ['id', 'dept_name']
                },
            ]

        }).then(function(expenses) {
            // renders a post list page
            console.log("rendering expense list");
            if (expenses.length === 0) {
                res.json({
                    status: false,
                    data: 'None',
                    message: 'No Expense available'
                })
            } else {
                res.json({
                    status: true,
                    data: expenses,
                    message: 'Expenses Listed successfully'
                })
            }

            console.log("Expenses list renders successfully");
        });
    } catch (error) {
        res.status(400).json({
            status: false,
            message: `There was an error - ${error}`
        });
    }


};

// LIST ALL MY EXPENSES.
exports.my_expenses = function(req, res, next) {
    try {
        models.Expense.findAll({
            where: {
                CurrentBusinessId: req.user.CurrentBusinessId,
                userId: req.user.id
            },
            order: [
                ['id', 'DESC'],
            ],
            include: [{
                    model: models.user,
                    attributes: ['id', 'firstname', 'lastname', 'name']
                },
                {
                    model: models.Category,
                    attributes: ['id', 'category_name']
                },
                {
                    model: models.Type,
                    attributes: ['id', 'type_name']
                },
                {
                    model: models.Department,
                    attributes: ['id', 'dept_name']
                },
            ]

        }).then(function(expenses) {
            // renders a post list page
            console.log("rendering expense list");
            if (expenses.length === 0) {
                res.json({
                    status: false,
                    data: 'None',
                    message: 'No Expense available'
                })
            } else {
                res.json({
                    status: true,
                    data: expenses,
                    message: 'Expenses Listed successfully'
                })
            }

            console.log("Expenses list renders successfully");
        });
    } catch (error) {
        res.status(400).json({
            status: false,
            message: `There was an error - ${error}`
        });
    }
};

// DASHBOARD.
exports.index = async function(req, res) {
    try {
        const employees = await models.user.findAll({
            where: {
                CurrentBusinessId: req.user.CurrentBusinessId,
            },
            include: [
                {
                    model: models.Role,
                },
                {
                    model: models.CurrentBusiness,
                },
                {
                    model: models.Department,
                },
            ]
        });
        const totalSum = await models.Expense.sum('amount', {
            where: {
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        
        // const totalSum = getSum('Approved', req.user.CurrentBusinessId);
        
        const myTotalSum = await models.Expense.sum('amount', {
            where: {
                userId: req.user.id,
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
       const expensesToday = await models.Expense.findAll({
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('date')
                },
                CurrentBusinessId: req.user.CurrentBusinessId,
            }
        });
        const totalSumToday = await models.Expense.sum('amount', {
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('date')
                },
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        const myTotalSumToday = await models.Expense.sum('amount', {
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('date')
                },
                userId: req.user.id,
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        const totalSumYesterday = await models.Expense.sum('amount', {
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('day').add(-1, 'day'),
                    [Op.lte]: moment().startOf('day')
                },
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        const myTotalSumYesterday = await models.Expense.sum('amount', {
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('day').add(-1, 'day'),
                    [Op.lte]: moment().startOf('day')
                },
                userId: req.user.id,
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        const totalSumThisWeek = await models.Expense.sum('amount', {
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('week'),
                    [Op.lte]: moment().startOf('day')
                },
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        const myTotalSumThisWeek = await models.Expense.sum('amount', {
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('week'),
                    [Op.lte]: moment().startOf('day')
                },
                userId: req.user.id,
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        const totalSumThisMonth = await models.Expense.sum('amount', {
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('month'),
                    [Op.lte]: moment().startOf('day')
                },
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        const myTotalSumThisMonth = await models.Expense.sum('amount', {
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('month'),
                    [Op.lte]: moment().startOf('day')
                },
                userId: req.user.id,
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        const totalSumThisYear = await models.Expense.sum('amount', {
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('year'),
                    [Op.lte]: moment().startOf('day')
                },
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        const myTotalSumThisYear = await models.Expense.sum('amount', {
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('year'),
                    [Op.lte]: moment().startOf('day')
                },
                userId: req.user.id,
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        
        models.Expense.findAll({
            where: {
                CurrentBusinessId: req.user.CurrentBusinessId,
                DepartmentId: req.user.DepartmentId
            },
            order: [
                ['id', 'DESC'],
            ],
            include: [
                {
                    model: models.user,
                    attributes: ['id', 'firstname', 'lastname', 'name']
                },
                {
                    model: models.Category,
                    attributes: ['id', 'category_name']
                },
                {
                    model: models.Type,
                    attributes: ['id', 'type_name']
                },
                {
                    model: models.Department,
                    attributes: ['id', 'dept_name']
                },
            ]
        }).then(function(expenses) {

            console.log("this is the total sum of expenses = " + totalSum);

            res.status(200).json({
                status: true,
                expenseCount: expenses.length,
                employees: employees,
                employeeCount: employees.length,
                totalSum: totalSum,
                myTotalSum: myTotalSum,
                expenses: expenses,
                expensesToday: expensesToday,
                expensesTodayCount: expensesToday.length,
                totalSumToday: totalSumToday,
                myTotalSumToday: myTotalSumToday,
                totalSumYesterday: totalSumYesterday,
                myTotalSumYesterday: myTotalSumYesterday,
                totalSumThisWeek: totalSumThisWeek,
                myTotalSumThisWeek: myTotalSumThisWeek,
                totalSumThisMonth: totalSumThisMonth,
                myTotalSumThisMonth: myTotalSumThisMonth,
                totalSumThisYear: totalSumThisYear,
                myTotalSumThisYear: myTotalSumThisYear
            })

        });
    } catch (error) {
        res.status(400).json({
            status: false,
            message: `There was an error - ${error}`
        });
    }
};

// DASHBOARD DATA.
exports.dashboadStats = async function(req, res) {
    try {
        // general sum of everything
        const totalSum = await models.Expense.sum('amount', {
            where: {
                CurrentBusinessId: req.user.CurrentBusinessId,
            }
        });
        const totalSumApproved = await models.Expense.sum('amount', {
            where: {
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        const totalSumPending = await models.Expense.sum('amount', {
            where: {
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Pending'
            }
        });
        const totalSumDeclined = await models.Expense.sum('amount', {
            where: {
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Declined'
            }
        });
        
        // const totalSum = getSum('Approved', req.user.CurrentBusinessId);
        
        // general sum for the auth user
        const myTotalSum = await models.Expense.sum('amount', {
            where: {
                userId: req.user.id,
                CurrentBusinessId: req.user.CurrentBusinessId,
            }
        });
        
        const myTotalSumApproved = await models.Expense.sum('amount', {
            where: {
                userId: req.user.id,
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        
        const myTotalSumPending = await models.Expense.sum('amount', {
            where: {
                userId: req.user.id,
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Pending'
            }
        });
        
        const myTotalSumDeclined = await models.Expense.sum('amount', {
            where: {
                userId: req.user.id,
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Declined'
            }
        });
        
        // expenses for today
        const expensesToday = await models.Expense.findAll({
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('date')
                },
                CurrentBusinessId: req.user.CurrentBusinessId,
            }
        });
        const expensesTodayApproved = await models.Expense.findAll({
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('date')
                },
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        const expensesTodayPending = await models.Expense.findAll({
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('date')
                },
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Pending'
            }
        });
        const expensesTodayDeclined = await models.Expense.findAll({
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('date')
                },
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Declined'
            }
        });
        
        // sum of expenses today
        const totalSumToday = await models.Expense.sum('amount', {
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('date')
                },
                CurrentBusinessId: req.user.CurrentBusinessId,
            }
        });
        const myTotalSumToday = await models.Expense.sum('amount', {
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('date')
                },
                userId: req.user.id,
                CurrentBusinessId: req.user.CurrentBusinessId,
            }
        });
        
        // sum of expenses yesterday
        const totalSumYesterday = await models.Expense.sum('amount', {
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('day').add(-1, 'day'),
                    [Op.lte]: moment().startOf('day')
                },
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        const myTotalSumYesterday = await models.Expense.sum('amount', {
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('day').add(-1, 'day'),
                    [Op.lte]: moment().startOf('day')
                },
                userId: req.user.id,
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        const totalSumThisWeek = await models.Expense.sum('amount', {
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('week'),
                    [Op.lte]: moment().startOf('day')
                },
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        const myTotalSumThisWeek = await models.Expense.sum('amount', {
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('week'),
                    [Op.lte]: moment().startOf('day')
                },
                userId: req.user.id,
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        const totalSumThisMonth = await models.Expense.sum('amount', {
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('month'),
                    [Op.lte]: moment().startOf('day')
                },
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        const myTotalSumThisMonth = await models.Expense.sum('amount', {
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('month'),
                    [Op.lte]: moment().startOf('day')
                },
                userId: req.user.id,
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        const totalSumThisYear = await models.Expense.sum('amount', {
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('year'),
                    [Op.lte]: moment().startOf('day')
                },
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        const myTotalSumThisYear = await models.Expense.sum('amount', {
            where: {
                createdAt: {
                    [Op.gte]: moment().startOf('year'),
                    [Op.lte]: moment().startOf('day')
                },
                userId: req.user.id,
                CurrentBusinessId: req.user.CurrentBusinessId,
                status: 'Approved'
            }
        });
        
        models.Expense.findAll({
            where: {
                CurrentBusinessId: req.user.CurrentBusinessId,
                DepartmentId: req.user.DepartmentId
            },
            include: [
                {
                    model: models.user,
                    attributes: ['id', 'firstname', 'lastname', 'name']
                },
                {
                    model: models.Category,
                    attributes: ['id', 'category_name']
                },
                {
                    model: models.Type,
                    attributes: ['id', 'type_name']
                },
                {
                    model: models.Department,
                    attributes: ['id', 'dept_name']
                },
            ]
        }).then(function(expenses) {

            console.log("this is the total sum of expenses = " + totalSum);

            res.status(200).json({
                status: true,
                expenseCount: expenses.length,
                employees: employees,
                employeeCount: employees.length,
                totalSum: totalSum,
                myTotalSum: myTotalSum,
                expenses: expenses,
                expensesToday: expensesToday,
                expensesTodayCount: expensesToday.length,
                totalSumToday: totalSumToday,
                myTotalSumToday: myTotalSumToday,
                totalSumYesterday: totalSumYesterday,
                myTotalSumYesterday: myTotalSumYesterday,
                totalSumThisWeek: totalSumThisWeek,
                myTotalSumThisWeek: myTotalSumThisWeek,
                totalSumThisMonth: totalSumThisMonth,
                myTotalSumThisMonth: myTotalSumThisMonth,
                totalSumThisYear: totalSumThisYear,
                myTotalSumThisYear: myTotalSumThisYear
            })

        });
    } catch (error) {
        res.status(400).json({
            status: false,
            message: `There was an error - ${error}`
        });
    }
};


// EXPENSE APPROVAL
exports.expense_approval_get = async function(req, res) {
    // validates if the params ID is an integer
    var expense_id = await checkParamsId(req, res, 'Expense', req.params.expense_id);
    var status_code = await checkParamsId(req, res, 'Status Code', req.params.status_code);

    console.log("The status_code is not null " + status_code);
    console.log("The expense id is not null " + expense_id);

    // Performs operation
    try {
        // checks if the ID exists
        var thisExpense = expense_id ? await models.Expense.findById(expense_id) : null
        if (!thisExpense) {
            return res.status(400).json({
                status: false,
                message: 'Expense ID not found'
            });
        }

        
        // checks if the manager belongs to this expense's department and is also assigned to review this expense.
        if (thisExpense.DepartmentId == req.user.DepartmentId && thisExpense.ReviewerId == req.user.id && req.user.Role.role_name == 'Manager') {
            var status = (status_code == 1) ? 'Approved' : (status_code == 2) ? 'Declined' : null;
        } else {
            return res.status(401).send({
                status: false,
                message: 'Operation denied, you are either not a manager or not assigned to review this expense!'
            });
        }
        


        if (!status) {
            return res.status(401).json({
                status: false,
                message: 'Unidentified status code'
            });
        }

        console.log("The status_code is not null " + status_code);
        console.log("The expense id is not null " + expense_id);
        
        var reviewed = await checkExpenseStatus(req, res, thisExpense.status);
        if (reviewed) {
            models.Expense.update(
                { status: status, reviewer: req.user.name }, {
                    where: { id: expense_id }
                }
    
            ).then(function() {
                var message = "Operation Successful"
                res.status(200).json({
                    status: true,
                    message: message
                })
            });
        }
        
    } catch (error) {
        res.status(400).json({
            status: false,
            message: `There was an error - ${error}`
        });
    }
};

// async function getAprovalStatus(id) {
//     var status;
//     return status = (id == 1) ? 'Approved' : (id == 2) ? 'Declined' : 'Pending';
// }

// async function getStatus(amount) {
//     var status;
// }

function getSum(status, currentBusinessId) {
    models.Expense.sum('amount', {
        where: {
            CurrentBusinessId: currentBusinessId,
            status: status,
        }
    });
}