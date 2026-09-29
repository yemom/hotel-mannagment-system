package com.hotelmanagement.model;

public enum SpaCategory {
    MASSAGE,
    FACIAL,
    BODY_TREATMENT,
    WELLNESS,
    COUPLES,
    BEAUTY;

    public String getDisplayName() {
        switch (this) {
            case MASSAGE:
                return "Massage";
            case FACIAL:
                return "Facial";
            case BODY_TREATMENT:
                return "Body Treatment";
            case WELLNESS:
                return "Wellness";
            case COUPLES:
                return "Couples";
            case BEAUTY:
                return "Beauty";
            default:
                return name();
        }
    }
}
