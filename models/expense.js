'use strict';
module.exports = (sequelize, DataTypes) => {
  var Expense = sequelize.define('Expense', {
    title:{type: DataTypes.STRING},
    desc:{type: DataTypes.TEXT},
    amount:{type: DataTypes.INTEGER},
    status:{type: DataTypes.ENUM('Pending', 'Approved', 'Declined'), defaultValue: 'Pending'},
    DepartmentId: DataTypes.INTEGER,
    TypeId: DataTypes.INTEGER,
    CategoryId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    
  });
  

      
  Expense.associate = function (models) { 
    
    models.Expense.belongsTo(models.user, {
      onDelete: "CASCADE",
      foreignKey: {
      allowNull: true
    }
    });
  
    models.Expense.belongsTo(models.user, {
      onDelete: "CASCADE",
      foreignKey: {
      name: 'ApproverId',
      allowNull: true
    }
    });

    models.Expense.belongsTo(models.Category, {
      onDelete: "CASCADE",
      foreignKey: {
      allowNull: true
    }
    });
    
    models.Expense.belongsTo(models.Type, {
      onDelete: "CASCADE",
      foreignKey: {
      allowNull: true
    }
    });

    models.Expense.belongsTo(models.Department, {
      onDelete: "CASCADE",
      foreignKey: {
      allowNull: true
    }
    });
    
    models.Expense.belongsTo(models.CurrentBusiness, {
      onDelete: "CASCADE",
      foreignKey: {
        allowNull: false
      }
    });
  };

  return Expense;
};

// Make sure you complete other models fields