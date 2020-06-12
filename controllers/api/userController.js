var Employee = require('../../models/employee');
var models = require('../../models');
const { check, validationResult } = require('express-validator');
var checkParamsId = require('../../helpers/checkParams');

// Handle employee create on POST.
exports.employee_create_post = [
  [
      // Validation for inputs
      check('firstname')
      .isLength({ min: 3, max: 50 }).withMessage('Firstname must be between 3 and 50 characters long')
      .not().isEmpty().withMessage('Firstname cannot be empty')
      .matches(/^[A-Za-z\s]+$/).withMessage('Firstname must contain only Letters.'),
      check('lastname')
      .isLength({ min: 3, max: 50 }).withMessage('Lastname must be between 3 and 50 characters long')
      .not().isEmpty().withMessage('Lastname cannot be empty')
      .matches(/^[A-Za-z\s]+$/).withMessage('Lastname must contain only Letters.'),
      check('username')
      .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters long')
      .not().isEmpty().withMessage('Username cannot be empty')
      .isAlphanumeric().withMessage('Username can only be alphanumeric.'),
      check('email')
      .not().isEmpty().withMessage('Email cannot be empty')
      .isEmail().withMessage('Invalid Email'),
      check('password')
      .isLength({ min: 6, max: 50 }).withMessage('Password must be between 6 and 50 characters long')
      .not().isEmpty().withMessage('Password cannot be empty'),
      check('department')
      .not().isEmpty().withMessage('Department cannot be empty')
      .isInt().withMessage('Department must be numeric'),
      check('role')
      .not().isEmpty().withMessage('Role cannot be empty')
      .isInt().withMessage('Role must be numeric'),
    ],
    
  async function(req, res, next) {
        // checks for validations
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ status: false, errors: errors.array() });
        }
  // create a new employee based on the fields in our employee model
  // I have create two fields, but it can be more for your model
   console.log("This is the user " + req.body.username);
     
     
     
      var employee = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        DepartmentId: req.body.department,
        RoleId: req.body.role
      }
       
     
      models.user.create(employee).then(function(employee){
          res.json({
            status: true,
            data: employee,
            message: 'Employee created successfully'
          })
        console.log("Employee created successfully");
      });
  
  
  }
];



// Handle employee delete on POST.
exports.employee_delete_post = async function(req, res, next) {
 
    // validates if the ID is an integer
    
    var employee_id = await checkParamsId(req, res, 'Employee', req.params.employee_id);
  
    var thisEmployee = employee_id ? await models.user.findById(employee_id) : null
    // checks if the ID exists
    
    if (!thisEmployee) {
      return res.status(400).json({
          status: false,
          message: 'Employee ID not found'
        });
    }
    // Performs Operation
    try {
      models.user.destroy({
        // find the author_id to delete from database
        where: {
          id: employee_id
        }
      }).then(function() {
        res.status(200).json({
          status: true,
          message: 'Employee deleted successfully'
        })
         console.log("Employee deleted successfully");
      
      });
    } catch (error) {
      res.status(400).json({
        status: false,
        message: `There was an error - ${error}`
      });
    }
};


// Handle post update on POST.
exports.employee_update_post = async function(req, res, next) {
  
       // validates if the ID is an integer
       var employee_id = await checkParamsId(req, res, 'Employee', req.params.employee_id);
  
        var thisEmployee = employee_id ? await models.user.findById(employee_id) : null
       
        if (!thisEmployee) {
          return res.status(400).json({
              status: false,
              message: 'Employee ID not found'
            });
        }

        try {
          var employee = {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
          }
          models.user.update(
            // Values to update
                {
                    employee
                },
              { // Clause
                    where: 
                    {
                        id: employee_id
                    }
                }
            //   returning: true, where: {id: req.params.post_id} 
             ).then(function(employee) {
              res.status(200).json({
                status: true,
                data: employee,
                message: 'Employee updated successfully'
              })  
              console.log("Employee updated successfully");
        });
        } catch (error) {
          res.status(400).json({
            status: false,
            message: `There was an error - ${error}`
          });
        }
        
};

// Display list of all employees.
exports.employee_list = function(req, res, next) {

        try {
          models.user.findAll({
            include: [
                {
                  model: models.Department,
                  attributes: ['id', 'dept_name']
                },
                {
                  model: models.Role,
                  attributes: ['id', 'role_name']
                }
            ]
          }).then(function(employees) {
            
              console.log("rendering employee list");
              if (employees.length === 0) {
                res.status(400).json({
                  status: false,
                  data: employees,
                  message: 'No Employee available'
                })
              } else {
                res.status(400).json({
                  status: true,
                  data: employees,
                  message: 'Employees Listed successfully'
                })
              }
              
              console.log("Employees list renders successfully");
              });
        } catch (error) {
          res.status(400).json({
            status: false,
            message: `There was an error - ${error}`
          });
        }
        
      
};

// Display detail page for a specific author.
exports.employee_detail = async function(req, res, next) {
  
  var employee_id = await checkParamsId(req, res, 'Employee', req.params.employee_id);
  
  var thisEmployee = employee_id ? await models.user.findById(employee_id) : null
    
  if (!thisEmployee) {
      return res.status(400).json({
          status: false,
          message: 'Employee ID not found'
        });
  }

  console.log('This is the employee ' + thisEmployee);

  try {
    
    console.log("This is the employee id " + employee_id);
    // console.log("This is the employee department " + req.params.employee_department);
    // Listing all expenses created by an employee
    const expenses = await models.Expense.findAll({
      include: [
        {
          model: models.user,
          attributes: ['id', 'firstname', 'lastname','DepartmentId']
        },
      ],
        where: {
          userId: employee_id,
        },
    });

    // Listing all expenses created by all employees
    // const deptExpenses = await models.Expense.findAll({
    //   where: {
    //     DepartmentId: req.params.employee_department,
    //   },
    // });

    

    const allExpenses = await models.Expense.findAll({
      include: [
        {
          model: models.user,
          attributes: ['id', 'firstname', 'lastname']
        },
      ]
    });

    const employeeExpenses = await  models.Expense.findAndCountAll({
      where: {userId: employee_id}
    });

    const employeeTotalExpenses = await models.Expense.sum('amount', {where: {userId: employee_id} });
    const categories = await models.Category.findAll();
    const types = await models.Type.findAll();
    const departments = await models.Department.findAll();
    const roles =  await models.Role.findAll();
    const employees =  await models.user.findAll({
      include: [
        {
          model: models.Department,
          attributes: ['id', 'dept_name']
        },
        {
          model: models.Role,
          attributes: ['id', 'role_name']
        }
      ]
    });

    console.log("This is the expenses for that employed id " + employee_id);
    // console.log("This is the expenses for that employee dept " + req.params.employee_department);

     models.user.findById(
      employee_id, 
      {
          include: [
            {
              model: models.Expense,
              // attributes: [ 'title', 'desc','amount','category','status','userId','createdAt','department' ],
                  
            },
            {
              model: models.Department,
              attributes: ['id', 'dept_name']
            },
            {
              model: models.Role,
              attributes: ['id', 'role_name']
            }
               ]
          }
      ).then(function(employee) {
      // console.log("This is employee expense " + employee.expenses.length);
      // renders an inividual post details page
      if (!employee) {
        res.status(400).json({
            status: false,
            data: 'None',
            message: 'Employee not found'
        });
        } else {
        res.status(200).json({
            status: true,
            data: employee,
            employees:employees, 
            expenses: expenses,
            departments: departments,
            roles: roles, 
            // deptExpenses: deptExpenses,
            allExpenses: allExpenses,
            employeeTotalExpenses: employeeTotalExpenses,
            employeeExpenses: employeeExpenses,
            categories: categories,
            types: types,
            message: 'Employee details rendered successfully'
        });
        }
      console.log("Employee detials renders successfully");
      });
  } catch (error) {
    res.status(400).json({
      status: false,
      message: `There was an error - ${error}`
    });
  }
};
