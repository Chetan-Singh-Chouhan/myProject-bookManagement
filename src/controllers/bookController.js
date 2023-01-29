const bookModel=require("../models/bookModel")
const userModel=require("../models/userModel")
const validation=require("../validation/validation")
const validId = require('valid-objectid');
const moment = require('moment')
moment.suppressDeprecationWarnings = true;


const createBooks= async (req,res)=>{
    try{
    let data = req.body;
    let {title,excerpt,userId,ISBN,category,subcategory, releasedAt} = data
    
    title = title.trim().toLowerCase();
    if(!title || title == "") return res.status(400).send({status:false,message:"title is mandatory"})
    if(typeof(title) != "string") return res.status(400).send({status:false, message:"Invalid title format"})
    if(!validation.validateTitle(title)) return res.status(400).send({status:false, message:"Please enter valid title"})

    if(!excerpt) return res.status(400).send({status:false, message:"excerpt is mandatory"})
    if(typeof(excerpt) != "string") return res.status(400).send({status:false, message:"Invalid excerpt format"})
    if(!validation.validateTitle(excerpt)) return res.status(400).send({status:false, message:"Please enter valid excerpt"})

    if(!userId) return res.status(400).send({status:false, message:"user Id is mandatory"})
    if(typeof(userId) != "string") return res.status(400).send({status:false, message:"Invalid userId format"})
    if(!validId.isValid(userId)) return res.status(400).send({status:false, message:"Please enter valid userId"})
    
    if(userId !== req.userId) return res.status(403).send({status:false,message:"you are not authorised for this action"})

    if(!ISBN) return res.status(400).send({status:false, message:"ISBN is mandatory"})
    if(typeof(ISBN) != "string") return res.status(400).send({status:false, message:"Invalid ISBN format"})
    if(!validation.validateISBN(ISBN)) return res.status(400).send({status:false, message:"Please enter valid ISBN"})

    if(!category) return res.status(400).send({status:false, message:"category is mandatory"})
    if(typeof(category) != "string") return res.status(400).send({status:false, message:"Invalid category format"})
    if(!validation.validate(category)) return res.status(400).send({status:false, message:"Please enter valid category"})


    if(!subcategory) return res.status(400).send({status:false, message:"subcategory is mandatory"})
    if(typeof(subcategory) != "string") return res.status(400).send({status:false, message:"Invalid subcategory format"})
    if(!validation.validate(subcategory)) return res.status(400).send({status:false, message:"Please enter valid subcategory"})

    if(!releasedAt) return res.status(400).send({status:false, message:"releasedAt is mandatory"})
    if(typeof(releasedAt) != "string") return res.status(400).send({status:false, message:"Invalid releasedAt format"})
    if(moment(releasedAt).format("YYYY-MM-DD") != releasedAt) return res.status(400).send({status:false, message:"Invalid date format"})
    
    const checkUserId= await userModel.findById(userId)

    if(!checkUserId) return res.status(404).send({status:false, message:"User does not exist"})

    const checkUniqueness= await bookModel.findOne({$or:[{title:title}, {ISBN:ISBN}]})

    if (checkUniqueness) {
    if(checkUniqueness.title == title) return res.status(400).send({status:false, message:"title already exist"})
    if(checkUniqueness.ISBN == ISBN) return res.status(400).send({status:false, message:"ISBN already exist"})
    }

    let createBook= await bookModel.create(data)
    res.status(201).send({status:true, message:"Success", data:createBook})    
    } catch(err){
        res.status(500).send({status:false, message:err.message})
    }
}

const getBooks=async(req, res)=>{

    let { userId, category, subcategory } = req.query

    let filter = {isDeleted:false}

    if (userId) {
        if(!validId.isValid(userId)) return res.status(400).send({status:false, message:"Please enter valid userId"})

        filter.userId = userId
    }
    
    if(category) {
        if(!validation.validate(category)) return res.status(400).send({status:false, message:"Please enter valid category"})

        filter.category = category
    }

    if(subcategory) {
        if(!validation.validate(subcategory)) return res.status(400).send({status:false, message:"Please enter valid category"})

        filter.subcategory = subcategory
    }

    let allBooks = await bookModel.find(filter).select({ISBN:0, subcategory:0, __V:0, createdAt:0, updatedAt:0}).sort({title:1})

    if (allBooks.length == 0) {
        return res.status(404).send({status:false, message:"No book exist in the collection"})
    }

    return res.status(200).send({status:true, data:allBooks})
}

const getBooksById = async function (req, res) {
    try{
      const bookId= req.params.bookId
      // console.log(bookId)/
      const getBooksData = await bookModel.findOne({_id:bookId,isDeleted:false})
      // console.log(getBooksData)
      if(!getBooksData) 
        return res.status(404).send({
          status: false,
          message: "Book Id Doesn't exist"
        })
      return res.status(200).send({
        status: true,
        message: 'Books List',
        data: getBooksData
      })
    }
    catch{
      return res.status(500).send({
        status: false,
        message: "->Server Side Error"
      })
    }

    

};

const updateBooks = async(req, res)=>{

    let bookId = req.params.bookId
    
    if (!bookId) {
        return res.status(400).send({status:false, msg:"please send valid params"})
    }

    if (!validId.isValid(bookId)) {
        return res.status(400).send({status:false, msg:"please send valid id"})
    }

    let {title, excerpt, releasedAt, ISBN} = req.body

    if (title) {
        title = title.trim().toLowerCase();

    if(title=="") return res.status(400).send({status:false,message:"Please input new title to update"})
    if(!validation.validateTitle(title)) return res.status(400).send({status:false, message:"Please enter valid title"})
    }

    if (excerpt) {
        excerpt = excerpt.trim()

        if(excerpt == "") return res.status(400).send({status:false, message:"Please input new excerpt to update "})
    if(!validation.validateTitle(excerpt)) return res.status(400).send({status:false, message:"Please enter valid excerpt"})
    }

    if(!releasedAt) return res.status(400).send({status:false, message:"releasedAt is mandatory"})
    if(typeof(releasedAt) != "string") return res.status(400).send({status:false, message:"Invalid releasedAt format"})
    if(moment(releasedAt).format("YYYY-MM-DD") != releasedAt) return res.status(400).send({status:false, message:"Invalid date format"})

    //we can do check unique or deleted together
    let checkUnique = await bookModel.findOne({$or:[{title:title}, {ISBN:ISBN}]})

    if (checkUnique) {
        return res.status(400).send({status:false, msg:"Duplicate title or ISBN"})
    }

    //or we can check it here also
    let updateBook = await bookModel.findOneAndUpdate({_id:bookId, isDeleted:false}, {$set:{title:title, excerpt:excerpt, releasedAt:releasedAt, ISBN:ISBN}}, {new:true});

    if (!updateBook) {
        return res.status(404).send({status:false, msg:"The book does not exist"})
    }

    return res.status(200).send({status:true, data:updateBook})

}

const deleteBooks= async (req,res)=>{
    try{
    let bookId=req.params.bookId;

    if(!validation.validateObjectId(bookId)) return res.status(400).send({status:false, message:"Please enter valid bookId"})

    let bookDelete= await bookModel.findOneAndUpdate({$and:[{_id:bookId},{isDeleted:false}]},{$set:{isDeleted:true}},{new:true})
    
    if(!bookDelete) return res.status(404).send({status:false, message:"Book not found"})
    
    res.status(200).send({status:true, message:"Success",data:bookDelete })
} catch(err){
    res.status(500).send({status:false, message:err.message})
}
}

module.exports={createBooks, getBooks, getBooksById,updateBooks,deleteBooks}