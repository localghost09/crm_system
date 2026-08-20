const cron = require('node-cron');
const { FollowUp, Task, Notification } = require('../models');

// Check upcoming follow-ups every hour
cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingFollowUps = await FollowUp.find({
      isActive: true,
      status: 'Pending',
      followUpDate: { $gte: now, $lte: in24Hours },
    }).populate('assignedTo');

    for (const followup of upcomingFollowUps) {
      if (followup.assignedTo) {
        await Notification.create({
          user: followup.assignedTo._id,
          type: 'follow_up_reminder',
          title: 'Follow-up Reminder',
          message: 'Follow-up "' + followup.title + '" is due at ' + followup.followUpDate.toLocaleString(),
          relatedTo: followup._id,
          relatedModel: 'FollowUp',
        });
      }
    }

    if (upcomingFollowUps.length > 0) {
      console.log('Created ' + upcomingFollowUps.length + ' follow-up reminders');
    }
  } catch (error) {
    console.error('Follow-up reminder job error:', error.message);
  }
});

// Check overdue tasks every 6 hours
cron.schedule('0 */6 * * *', async () => {
  try {
    const now = new Date();

    // Mark tasks as overdue
    const overdueTasks = await Task.find({
      isActive: true,
      status: { $nin: ['Completed', 'Overdue'] },
      dueDate: { $lt: now },
    });

    for (const task of overdueTasks) {
      task.status = 'Overdue';
      await task.save();

      if (task.assignedTo) {
        await Notification.create({
          user: task.assignedTo,
          type: 'task_overdue',
          title: 'Task Overdue',
          message: 'Task "' + task.title + '" is now overdue.',
          relatedTo: task._id,
          relatedModel: 'Task',
        });
      }
    }

    // Mark overdue follow-ups
    await FollowUp.updateMany(
      {
        isActive: true,
        status: 'Pending',
        followUpDate: { $lt: now },
      },
      { status: 'Overdue' }
    );

    if (overdueTasks.length > 0) {
      console.log('Marked ' + overdueTasks.length + ' tasks as overdue');
    }
  } catch (error) {
    console.error('Overdue detection job error:', error.message);
  }
});

console.log('CRM cron jobs initialized');