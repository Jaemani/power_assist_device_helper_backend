/* global use, db */
// MongoDB Playground
// To disable this template go to Settings | MongoDB | Use Default Template For Playground.
// Make sure you are connected to enable completions and to be able to run a playground.
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.
// The result of the last command run in a playground is shown on the results panel.
// By default the first 20 documents will be returned with a cursor.
// Use 'console.log()' to print to the debug output.
// For more documentation on playgrounds please refer to
// https://www.mongodb.com/docs/mongodb-vscode/playgrounds/

// Select the database to use.
use('sooriData');

db.repairs.aggregate([
  {
    $lookup: {
      from: "vehicles",
      localField: "vehicleId",
      foreignField: "_id",
      as: "vehicle"
    }
  },
  {
    $unwind: "$vehicle"
  },
  {
    $lookup: {
      from: "users",
      localField: "vehicle.userId",
      foreignField: "_id",
      as: "user"
    }
  },
  {
    $unwind: "$user"
  },
  {
    $project: {
      repairedAt: 1,
      billingPrice: 1,
      isAccident: 1,
      repairStationLabel: 1,
      "vehicle.vehicleId": 1,
      "user.name": 1
    }
  }
])
