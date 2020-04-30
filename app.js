const fs = require('fs')
const readline = require('readline')
const axios = require('axios')

const requestUrl = 'https://2swdepm0wa.execute-api.us-east-1.amazonaws.com/prod/NavaInterview/measures'
const schema = []

const readSchema = readline.createInterface({
  input: fs.createReadStream(__dirname + '/schemas/booleanmeasures.csv')
})

// Begin reading the schema file
readSchema.on('line', function(line) {
  const arr = line.split(',').map(item => item.trim())

  // store the information for each column as its own object in the schema array
  schema.push({
    name: arr[0],
    width: arr[1],
    datatype: arr[2]
  });
})

readSchema.on('close', () => {
  console.log('Done reading Schema')
  console.log('--------------------------')

  // Begin reading data file once we're done reading the schema file
  const readData = readline.createInterface({
    input: fs.createReadStream(__dirname + '/data/booleanmeasures.txt')
  })

  readData.on('line', function(line) {
    const result = {};
    let lineCopy = line;

    schema.forEach(param => {
      let value;
      lineCopy = lineCopy.trim(); // remove whitespace the bigging and end of the line

      // if the sub-string we're looking for contains a space,
      if (lineCopy.substr(0, param.width).includes(' ')) {
        // store the substring until the space,
        // then remove both the substring and the space from the line
        value = lineCopy.substr(0, lineCopy.indexOf(' '))
        lineCopy = lineCopy.replace(value + ' ', '')
      } else {
        // otherwise, store and remove only the substring
        value = lineCopy.substr(0, param.width)
        lineCopy = lineCopy.replace(value, '')
      }

      // convert the value to the proper data type and return it
      switch(param.datatype) {
        case 'INTEGER':
          return result[param.name] = parseInt(value)
        case 'BOOLEAN':
          return result[param.name] = !!+value
        case 'TEXT':
        default:
          return result[param.name] = value;
      }
    })

    // attempt to send the new record to the server
    console.log('Attempting to create record')
    axios.post(requestUrl, result)
      .then(res => {
        console.log(`statusCode: ${res.statusText}`)
      })
      .catch(error => {
        console.error(error)
      })
  })
})
