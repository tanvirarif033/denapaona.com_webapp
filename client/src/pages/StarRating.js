// StarRating.js
import React from "react";

const StarRating = ({ rating }) => {
  const totalStars = 5;
  const filledStars = Math.round(rating); // Round the rating to nearest integer

  return (
    <div className="star-rating">
      {Array.from({ length: totalStars }, (v, i) => (
        <span key={i} style={{ color: i < filledStars ? "#ffc107" : "#e4e5e9" }}>
          ★
        </span>
      ))}
    </div>
  );
};

export default StarRating;
