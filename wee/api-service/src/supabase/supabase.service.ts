import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ScheduleTask, UpdateScheduleTask, ScheduleTaskResponse, updateKeywordResult } from '../models/scheduleTaskModels';

@Injectable()
export class SupabaseService {
  supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  private readonly supabaseClient = createClient(this.supabaseURL, this.serviceKey);

  async updateSchedule(scheduleData: UpdateScheduleTask) {
    const { id, result_history, newCommentCount, newShareCount, newReactionCount, newTotalEngagement, newNewsSentiment, newRating, newNumReviews, newTrustIndex, newNPS, newRecommendationStatus, newStarRatings, newSiteSpeed, newPerformanceScore, newAccessibilityScore, newBestPracticesScore, newPinCount } = scheduleData;
    
    // get the current date and time
    const now = new Date();
    
    // append to necessary fields
    result_history.timestampArr.push(now.toISOString());
    result_history.commentCount.push(newCommentCount);
    result_history.shareCount.push(newShareCount);
    result_history.reactionCount.push(newReactionCount);
    result_history.totalEngagement.push(newTotalEngagement);
    result_history.pinCount.push(newPinCount);
    result_history.rating.push(newRating);
    result_history.numReviews.push(newNumReviews);
    result_history.trustIndex.push(newTrustIndex);
    result_history.NPS.push(newNPS);
    result_history.recommendationStatus.push(newRecommendationStatus);
    result_history.starRatings.push(newStarRatings);
    result_history.siteSpeed.push(newSiteSpeed);
    result_history.performanceScore.push(newPerformanceScore);
    result_history.accessibilityScore.push(newAccessibilityScore);
    result_history.bestPracticesScore.push(newBestPracticesScore);

    // calculate the average of the news sentiment scores
    let posAvg = 0;
    let negAvg = 0;
    let neuAvg = 0;
    for (const newsItem of newNewsSentiment) {
      posAvg += newsItem.sentimentScores?.positive || 0;
      negAvg += newsItem.sentimentScores?.negative || 0;
      neuAvg += newsItem.sentimentScores?.neutral || 0;
    }

    posAvg = posAvg / newNewsSentiment.length;
    negAvg = negAvg / newNewsSentiment.length;
    neuAvg = neuAvg / newNewsSentiment.length;

    result_history.newsSentiment.positiveAvg.push(posAvg);
    result_history.newsSentiment.negativeAvg.push(negAvg);
    result_history.newsSentiment.neutralAvg.push(neuAvg);

    const { data, error } = await this.supabaseClient
      .from('scheduled_tasks')
      .update({ result_history, updated_at: now.toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update schedule: ${error.message}`);
    }
    return data;
  }

  async updateKeywordResult(scheduleData: updateKeywordResult) {
    const { id, keyword, newRank, newTopTen, results} = scheduleData;

    // append to necessary fields
    const timestamp = new Date().toISOString();
    
    // find the keyword result object
    const keywordResult = results.find(result => result.keyword === keyword);
    // if the keyword result object does not exist, create a new one
    if (!keywordResult) {
      results.push({
        keyword,
        timestampArr: [timestamp],
        rankArr: [newRank],
        topTenArr: [newTopTen]
      });
    } else {
      // if the keyword result object exists, update the arrays
      keywordResult.timestampArr.push(timestamp);
      keywordResult.rankArr.push(newRank);
      // push each top ten result as a separate array
      keywordResult.topTenArr.push(newTopTen);
    }
    
    const { data, error } = await this.supabaseClient
      .from('scheduled_tasks')
      .update({ 
        keyword_results: results,
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update keyword result: ${error.message}`);
    }
    return data;
  }

  async getDueSchedules() {
    console.log('Getting due schedules...');

    // get the current date and time
    const now = new Date();

    const { data, error } = await this.supabaseClient
      .from('scheduled_tasks')
      .select('*')
      .lte('next_scrape', now.toISOString());

    if (error) {
      throw new Error(`Failed to fetch due schedules: ${error.message}`);
    }
    return data as ScheduleTaskResponse[];
  }

  async updateNextScrapeTime(schedule: ScheduleTaskResponse) {
      // Destructure the schedule object
      const { id, frequency } = schedule;
    
      // Determine the next scrape time based on the frequency
      let nextScrape: string;
      try {
        nextScrape = this.calculateNextScrapeTime(frequency);
      } catch (error) {
        throw new Error(`Failed to calculate next scrape time: ${error.message}`);
      }

      // Update the next scrape time in the database
      const { data, error } = await this.supabaseClient
        .from('scheduled_tasks')
        .update({ next_scrape: nextScrape })
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to update next scrape time: ${error.message}`);
      }
    
  }

  calculateNextScrapeTime(frequency: string): string {
    // Get the current date and time
    const now = new Date();
    
    // Create a new Date object to avoid mutating the original now object
    const nextScrape: Date = new Date(now.getTime());
    
    // Calculate the next scrape time based on the frequency
    switch (frequency) {
      case 'daily':
        nextScrape.setDate(nextScrape.getDate() + 1);
        break;
      case 'weekly':
        nextScrape.setDate(nextScrape.getDate() + 7);
        break;
      case 'bi-weekly':
        nextScrape.setDate(nextScrape.getDate() + 14);
        break;
      case 'monthly':
        nextScrape.setMonth(nextScrape.getMonth() + 1);
        break;
      default:
        throw new Error('Invalid frequency');
    }
  
    // Return the next scrape time in ISO format
    return nextScrape.toISOString();
  }
  
  async getEmailByScheduleId(scheduleId: string): Promise<string> {
    const { data, error } = await this.supabaseClient
      .from('scheduled_tasks')
      .select('user_id')
      .eq('id', scheduleId)
      .single(); 

    if (error || !data) {
      throw new Error(`Failed to get user_id from scheduled task: ${error?.message || 'No data found'}`);
    }

    const userId = data.user_id;

    const { data: profileData, error: profileError } = await this.supabaseClient
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single(); 

    if (profileError || !profileData) {
      throw new Error(`Failed to get email: ${profileError?.message || 'No data found'}`);
    }

    return profileData.email;
  }

}

