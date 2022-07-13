const bookModel = require('../models/bookModel')

const mongoose = require("mongoose")

const isValid = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  if (typeof value === "number") return false;
  return true;
};

const isValidBody = function (body) {
  return Object.keys(body).length > 0;
};

const isValidObjectId = function (ObjectId) {
  return mongoose.Types.ObjectId.isValid(ObjectId);
};





//❌❌❌❌❌❌❌❌❌❌=========== Create Book ==========❌❌❌❌❌❌❌❌❌❌//



const createBook = async function (req, res) {
  try {
    const bookData = req.body;
    if (!isValidBody(bookData)) {
      return res
        .status(400)
        .send({ status: false, message: "book details required" });
    }
    let { title, excerpt, userId, ISBN, category, subcategory, releasedAt } = bookData;
    let duplicateTitle = await bookModel.findOne({ title: title })
    if (duplicateTitle) return res.status(400).send({
      status: false, massage: "Title is allready Used in a book ,Please use another title"
    })
    if (!isValid(title)) {
      return res.status(400).send({ status: false, message: "Title is Required" })
    }
    if (!isValid(excerpt)) {
      return res
        .status(400)
        .send({ status: false, message: "excerpt is Required" });
    }
    if (!isValidObjectId(userId)) {
      return res
        .status(400)
        .send({ status: false, message: "  Missing userId or Invalid" });
    }
    let isbnRegex = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/

    let duplicateIsbn = await bookModel.findOne({ ISBN: ISBN })
    if (duplicateIsbn) return res.status(400).send({
      status: false, massage: "ISBN No is allready registered with a book  Please use another ISBN no"
    })

    if (!(isValid(ISBN) && isbnRegex.test(ISBN))) {
      return res
        .status(400)
        .send({ status: false, message: "ISBN no is  Required and it should be Valid and 10 or 13 digits" });
    }
    if (!isValid(category)) {
      return res
        .status(400)
        .send({ status: false, message: "category is Required" });
    }
    if (!isValid(subcategory)) {
      return res.status(400).send({ status: false, message: "subcategory is required" });
    }
    if (!isValid(releasedAt) && new Date()) {
      return res.status(400).send({ status: false, message: "releasing date required" });
    }

    let finalData ={title, excerpt, userId, ISBN, category, subcategory, releasedAt}
    let book = await bookModel.create(finalData);

    res.status(201).send({ status: true, message: "Success", data: book })
  } catch (err) {
    res.status(500).send({ status: false, message: err.message })
  }

};



//❌❌❌❌❌❌❌❌❌❌===========Get Books ==========❌❌❌❌❌❌❌❌❌❌//



const getBooks = async function (req, res) {
    
  let query = req.query
  try {
      if (Object.keys(query).length==0) {
          let allBook = await bookModel.find({ isDeleted: "false"})
          .select({ title: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1, reviews: 1 }).sort({ title: 1 });
      if (!allBook || allBook.length==0) return res.status(404).send({ status: "false", massage: "No book found", })
      return res.status(200).send({ status: "true",  message: 'Books list', data: allBook })
      }
  else{
      let Book = await bookModel.find({$and: [{ isDeleted: "false" }], $and: [query]})
      .select({ title: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1, reviews: 1 }).sort({ title: 1 });
      if (!Book || Book.length==0) return res.status(404).send({ status: "false", massage: "No book found", })
      res.status(200).send({ status: "true", message: 'Books list', data: Book })
  }
}
  catch (error) {
      console.log("This is the error :", error.message)
      res.status(500).send({ massage: "Error", error: error.message })
  }
}




//❌❌❌❌❌❌❌❌❌❌===========GetBook By BookId ==========❌❌❌❌❌❌❌❌❌❌//




const getBookDetailsById = async (req, res) => {
  try {
      let bookId = req.params.bookId


  
      if (!bookId) {return res.status(400).send({ status: false, message: 'Please provide bookId' })}
        bookId=bookId.trim()
      if (!isValidObjectId(bookId)) {
          return res.status(400).send({ status: false, message: 'Please provide valid bookId' })
      }

      

      let book = await bookModel.findOne({ _id: bookId, isDeleted: false }).select({ ISBN: 0, __v: 0, isDeleted:0 })
      
      if (!book) {return res.status(404).send({ status: false, message: 'No book found' })}
      
      
      let {...data} = book._doc
     
     let reviewdata = await bookModel.find({bookId: bookId}).select({isDeleted: 0, updatedAt: 0, createdAt: 0, __v: 0})

     data.reviewsData = reviewdata 

      return res.status(200).send({ status: true, message: 'Books list', data: data})
  } catch (err) {
      console.log(err)
      return res.status(500).send({ status: false, error: err.message });
  }
};





//❌❌❌❌❌❌❌❌❌❌=========== Update Book ==========❌❌❌❌❌❌❌❌❌❌//






const updateBookById = async function (req, res) {
  try {
    let updateBookData = req.body;
    let BookId = req.params.bookId;
    if (!isValidBody(updateBookData)) {
      return res.status(400).send({ status: false, message: "enter details to update book's information" });
    }

    if (!BookId) {
      return res.status(400).send({ status: false, message: "bookId is required" });
    }
    if (!isValidObjectId(BookId)) {
      return res.status(400).send({ status: false, message: "bookId not valid." })
    }

    checkBookId = await bookModel.findOne({ _id: BookId, isDeleted: false })

    if (!checkBookId) {
      return res.status(404).send({ status: false, message: "no book found" });
    }

    let { title, excerpt, releasedAt, ISBN } = updateBookData;

    let checkUniqueTitle = await bookModel.findOne({ title: title })
    if (checkUniqueTitle) {
      return res.status(400).send({ status: false, message: "title entered already exists. Please enter new title" });
    }

    let checkUniqueISBN = await bookModel.findOne({ ISBN: ISBN });
    if (checkUniqueISBN) {
      return res.status(400).send({ status: false, message: "ISBN entered already exists. Please enter new ISBN" });
    }

    let bookData = {};
    if (title) {
      if (!isValid(title)) {
        return res
          .status(400)
          .send({ status: false, message: "Title is not valid" });
      }
      bookData.title = title;
    }
    if (excerpt) {
      if (!isValid(excerpt)) {
        return res
          .status(400)
          .send({ status: false, message: "excerpt is not valid" });
      }
      bookData.excerpt = excerpt;
    }
    if (releasedAt) {
      if (!isValid(releasedAt)) {
        return res
          .status(400)
          .send({ status: false, message: "releasing date is not valid" });
      }
      bookData.releasedAt = releasedAt;
    }

    if (ISBN) {
      if (!isValid(ISBN)) {
        return res
          .status(400)
          .send({ status: false, message: "ISBN is not valid" });
      }
      bookData.ISBN = ISBN;
    }

    let updatedBook = await bookModel.findOneAndUpdate({ _id: BookId }, bookData, { new: true });

    res.status(200).send({ status: true, message: "Success", data: updatedBook })
  } catch (err) {
    res.status(500).send({ status: false, message: err.message })
  }

};



/*

const updateBookById = async function(req , res){
  try{
      let {title ,  excerpt,  ISBN } = req.body
      let book = req.book
      //if(!bodyValidator(req.body)) return res.status(400).send({status: false , massage: "please enter body"})
      if(book.isDeleted === false){
          if(isValid(title)) book.title = title
          if(isValid(excerpt)) book.excerpt = excerpt
          if(isValid(ISBN)) book.excerpt = ISBN
          
          let date = new Date();
          book.releasedAt = date
          book.save()
          res.status(200).send({status: true , data: book})
          
      }
      else{
          res.status(404).send({status: false , massage: "data not found or deleted"})
      }
  }
  catch(err){
      res.status(500).send({error : err.message})
  }

}

*/



//❌❌❌❌❌❌❌❌❌❌=========== DElete By BookId ==========❌❌❌❌❌❌❌❌❌❌//


/*

const deleteBookById = async (req, res) => {
  try {
    let bookId = req.params.bookId

    let findData = await bookModel.findById({ bookId });
    if (findData.isDeleted) return res.status(400).send({
      status: false,
      massage: " ❗ Oops  This 📖Book is Allready 💯 Deleted"
    })
    if (!findData) return
    res.status(404).send({
      status: false,
      massage: "User not found "
    });
    let deletedata = await bookModel.findOneAndUpdate(
      { _id: bookId },  // find
      { $set: { isDeleted: true, deletedAt: new Date() } },  //condition
      { new: true }    // new data
    );
    res.status(200).send({
      status: true,
      massage: "Your 📖BOOK is deleted successfully",
      data: deletedata
     

    });
  }
  catch (error) {
    console.log(error)
    return res.status(500).send({ status: false, massage: error.message })
  }
};

*/



const deleteBookById = async function (req, res) {
  try {
      let book = req.book
      if (book) {
          if (book.isDeleted == false) {
              book.isDeleted = true
              book.save()
              res.status(200).send({status:true, massage: "Your BOOK is deleted successfully",})
          } else{
              res.status(404).send({massage : "already deleted"})
          }
      }
      else {
          res.status(404).send({ status: false, massage: "book dosen't exist" })
      }
  }
  catch(err){
      res.status(500).send({massage : err.message})
  }
  
}






module.exports = { createBook, getBooks, getBookDetailsById, updateBookById, deleteBookById, }