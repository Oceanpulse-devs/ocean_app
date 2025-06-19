const {FeedsTable , UserTable} = require('../../models');
const{Op,Sequelize, and} = require('sequelize');


//to create feeds
const createFeed = async (req, res) => {
  try {
    const { postText, pic1, pic2, pic3,pic4,pic5,video1,video2,cartegory } = req.body;
    const userId = req.user.id; // Assuming user ID is stored in req.user

    const existingUser = await UserTable.findOne({
      where: { id: userId }
    });
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    // const postersId = existingUser.id;
    const username = existingUser.username;
    const profilePicture = existingUser.profilePicture;
    const country = existingUser.country;
    const location = existingUser.state;
    const region = existingUser.country;

    const feed = await FeedsTable.create({
      postersId: userId,
      username,
      profilePicture,
      postText,
      location,
      country,
      region,
      pic1,
      pic2,
      pic3,
      pic4,
      pic5,
      video1,
      video2,
      cartegory
    });

    res.status(201).json({ message: 'Feed created successfully', feed });
  } catch (error) {
    console.error('Error creating feed:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

//to get all feeds but randomly so user can see feeds change when ever they refresh
const getRandomFeed = async (req , res)=>{
    const allFeed = await FeedsTable.findAll({
       
        order: Sequelize.literal('RAND()'), // Random order
        limit: 10 // Adjust the limit as needed
    });
    res.status(200).json({ feeds: allFeed });
}

//to get all feeds by region
const getFeedsByRegion = async (req, res) => {
  const { region } = req.params;
  try {
    const feeds = await FeedsTable.findAll({
      where: { region },
      order: Sequelize.literal('RAND()') // Order by random
    });
    res.status(200).json({ feeds });
  } catch (error) {
    console.error('Error fetching feeds by region:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

// search feeds by postText content or location which is by state
const searchFeed = async(req,res)=>{
    const { query } = req.params;
    try {
        const feeds = await FeedsTable.findAll({
            where: {
                [Op.or]: [
                    { postText: { [Op.like]: `%${query}%` } },
                    { location: { [Op.like]: `%${query}%` } }
                ]
            },
             order: Sequelize.literal('RAND()') // Order by random
        });
        res.status(200).json({ feeds });
    } catch (error) {
        console.error('Error searching feeds:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

//get feed by id and postersId display it for editing
const getFeedById = async (req, res) => {
    const {feedId} = req.params;
    const currentUserId = req.user.id
    try {
        const singleFeed = await FeedsTable.findOne({
            where: {
                id: feedId,
                postersId: currentUserId
            }
        });

        if (!singleFeed) {
            return res.status(404).json({ message: 'Feed not found or not authorized' });
        }

        res.status(200).json({ feed: singleFeed });
    } catch (error) {
        console.error('Error fetching feed by id:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
   
}

//edit feed by id and postersId
const editFeedById = async (req, res) => {
    const { feedId } = req.params;
    const currentUserId = req.user.id;
    const { postText, pic1, pic2, pic3, pic4, pic5, video1, video2, cartegory } = req.body;

    try {
        const feed = await FeedsTable.findOne({
            where: {
                id: feedId,
                postersId: currentUserId
            }
        });

        if (!feed) {
            return res.status(404).json({ message: 'Feed not found or not authorized' });
        }

        // Update the feed with new data
        feed.postText = postText || feed.postText;
        feed.pic1 = pic1 || feed.pic1;
        feed.pic2 = pic2 || feed.pic2;
        feed.pic3 = pic3 || feed.pic3;
        feed.pic4 = pic4 || feed.pic4;
        feed.pic5 = pic5 || feed.pic5;
        feed.video1 = video1 || feed.video1;
        feed.video2 = video2 || feed.video2;
        feed.cartegory = cartegory || feed.cartegory;

        await feed.save();

        res.status(200).json({ message: 'Feed updated successfully', feed });
    } catch (error) {
        console.error('Error updating feed:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }      
 }

 //delete feed by id and postersId
 const deleteFeed = async (req, res) => {
    const { feedId } = req.params;
    const currentUserId = req.user.id;

    try {
        const feed = await FeedsTable.findOne({
            where: {
                id: feedId,
                postersId: currentUserId
            }
        });

        if (!feed) {
            return res.status(404).json({ message: 'Feed not found or not authorized' });
        }

        await feed.destroy();

        res.status(200).json({ message: 'Feed deleted successfully' });
    } catch (error) {
        console.error('Error deleting feed:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

//get all feeds by postersId for current user
const getFeedsByPostersId = async (req, res) => {
    const  postersId  = req.user.id
    try {
        const feeds = await FeedsTable.findAll({
            where: { postersId },
            order: [['createdAt', 'DESC']] // Order by creation date
        });
        if (feeds.length === 0) {
            return res.status(404).json({ message: 'No feeds found.' });
        }
       

        res.status(200).json({ feeds });
    } catch (error) {
        console.error('Error fetching feeds by postersId:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}   

module.exports = {
  createFeed , getRandomFeed , getFeedsByRegion,searchFeed,getFeedById,editFeedById,deleteFeed,getFeedsByPostersId
};