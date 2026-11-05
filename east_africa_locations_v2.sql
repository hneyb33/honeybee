/*
East Africa location seed — expanded starter gazetteer
Countries: KE, RW, BI, CD, SS, UG
Uganda additions: 4 regions, 135 district records, Kampala + 10 other cities,
selected towns, 5 Kampala divisions, and selected urban neighbourhoods.
Curated onboarding/search data; not a complete official gazetteer.
Administrative unit counts can vary by reference date and source. Validate statutory
status, boundaries, spellings and local government parentage before production.
*/
IF OBJECT_ID('dbo.Locations','U') IS NULL
BEGIN
    CREATE TABLE dbo.Locations (
        LocationCode varchar(80) NOT NULL PRIMARY KEY,
        ParentLocationCode varchar(80) NULL,
        CountryCode char(2) NOT NULL,
        Name nvarchar(160) NOT NULL,
        NormalizedName nvarchar(160) NOT NULL,
        LocationType varchar(24) NOT NULL,
        AdminLevel tinyint NULL,
        Aliases nvarchar(500) NULL,
        Notes nvarchar(500) NULL,
        IsActive bit NOT NULL CONSTRAINT DF_Locations_IsActive DEFAULT (1),
        IsVerified bit NOT NULL CONSTRAINT DF_Locations_IsVerified DEFAULT (0),
        CreatedAt datetime2 NOT NULL CONSTRAINT DF_Locations_CreatedAt DEFAULT (sysutcdatetime()),
        CONSTRAINT FK_Locations_Parent FOREIGN KEY (ParentLocationCode)
            REFERENCES dbo.Locations(LocationCode)
    );
    CREATE INDEX IX_Locations_Parent ON dbo.Locations(ParentLocationCode);
    CREATE INDEX IX_Locations_CountryType ON dbo.Locations(CountryCode, LocationType);
    CREATE INDEX IX_Locations_NormalizedName ON dbo.Locations(NormalizedName);
END;

-- Idempotent upsert; records are ordered parent-first.

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE')
    UPDATE dbo.Locations
       SET ParentLocationCode = NULL, CountryCode = 'KE', Name = N'Kenya',
           NormalizedName = N'kenya', LocationType = 'COUNTRY',
           AdminLevel = 0, Aliases = N'Kenya', Notes = NULL
     WHERE LocationCode = N'KE';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE', NULL, 'KE', N'Kenya', N'kenya',
            'COUNTRY', 0, N'Kenya', NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW')
    UPDATE dbo.Locations
       SET ParentLocationCode = NULL, CountryCode = 'RW', Name = N'Rwanda',
           NormalizedName = N'rwanda', LocationType = 'COUNTRY',
           AdminLevel = 0, Aliases = N'Rwanda', Notes = NULL
     WHERE LocationCode = N'RW';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW', NULL, 'RW', N'Rwanda', N'rwanda',
            'COUNTRY', 0, N'Rwanda', NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI')
    UPDATE dbo.Locations
       SET ParentLocationCode = NULL, CountryCode = 'BI', Name = N'Burundi',
           NormalizedName = N'burundi', LocationType = 'COUNTRY',
           AdminLevel = 0, Aliases = N'Burundi', Notes = NULL
     WHERE LocationCode = N'BI';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI', NULL, 'BI', N'Burundi', N'burundi',
            'COUNTRY', 0, N'Burundi', NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD')
    UPDATE dbo.Locations
       SET ParentLocationCode = NULL, CountryCode = 'CD', Name = N'Democratic Republic of the Congo',
           NormalizedName = N'democratic republic of the congo', LocationType = 'COUNTRY',
           AdminLevel = 0, Aliases = N'DR Congo|DRC|Congo-Kinshasa', Notes = NULL
     WHERE LocationCode = N'CD';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD', NULL, 'CD', N'Democratic Republic of the Congo', N'democratic republic of the congo',
            'COUNTRY', 0, N'DR Congo|DRC|Congo-Kinshasa', NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS')
    UPDATE dbo.Locations
       SET ParentLocationCode = NULL, CountryCode = 'SS', Name = N'South Sudan',
           NormalizedName = N'south sudan', LocationType = 'COUNTRY',
           AdminLevel = 0, Aliases = N'Republic of South Sudan', Notes = NULL
     WHERE LocationCode = N'SS';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS', NULL, 'SS', N'South Sudan', N'south sudan',
            'COUNTRY', 0, N'Republic of South Sudan', NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Baringo',
           NormalizedName = N'baringo', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-01', N'KE', 'KE', N'Baringo', N'baringo',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Bomet',
           NormalizedName = N'bomet', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-02', N'KE', 'KE', N'Bomet', N'bomet',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Bungoma',
           NormalizedName = N'bungoma', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-03', N'KE', 'KE', N'Bungoma', N'bungoma',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Busia',
           NormalizedName = N'busia', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-04', N'KE', 'KE', N'Busia', N'busia',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Elgeyo-Marakwet',
           NormalizedName = N'elgeyo-marakwet', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = N'Elgeyo Marakwet', Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-05', N'KE', 'KE', N'Elgeyo-Marakwet', N'elgeyo-marakwet',
            'ADMIN1', 1, N'Elgeyo Marakwet', NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-06')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Embu',
           NormalizedName = N'embu', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-06';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-06', N'KE', 'KE', N'Embu', N'embu',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-07')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Garissa',
           NormalizedName = N'garissa', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-07';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-07', N'KE', 'KE', N'Garissa', N'garissa',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-08')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Homa Bay',
           NormalizedName = N'homa bay', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-08';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-08', N'KE', 'KE', N'Homa Bay', N'homa bay',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-09')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Isiolo',
           NormalizedName = N'isiolo', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-09';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-09', N'KE', 'KE', N'Isiolo', N'isiolo',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-10')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Kajiado',
           NormalizedName = N'kajiado', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-10';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-10', N'KE', 'KE', N'Kajiado', N'kajiado',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-11')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Kakamega',
           NormalizedName = N'kakamega', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-11';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-11', N'KE', 'KE', N'Kakamega', N'kakamega',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-12')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Kericho',
           NormalizedName = N'kericho', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-12';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-12', N'KE', 'KE', N'Kericho', N'kericho',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-13')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Kiambu',
           NormalizedName = N'kiambu', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-13';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-13', N'KE', 'KE', N'Kiambu', N'kiambu',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-14')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Kilifi',
           NormalizedName = N'kilifi', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-14';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-14', N'KE', 'KE', N'Kilifi', N'kilifi',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-15')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Kirinyaga',
           NormalizedName = N'kirinyaga', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-15';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-15', N'KE', 'KE', N'Kirinyaga', N'kirinyaga',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-16')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Kisii',
           NormalizedName = N'kisii', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-16';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-16', N'KE', 'KE', N'Kisii', N'kisii',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-17')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Kisumu',
           NormalizedName = N'kisumu', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-17';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-17', N'KE', 'KE', N'Kisumu', N'kisumu',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-18')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Kitui',
           NormalizedName = N'kitui', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-18';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-18', N'KE', 'KE', N'Kitui', N'kitui',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-19')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Kwale',
           NormalizedName = N'kwale', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-19';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-19', N'KE', 'KE', N'Kwale', N'kwale',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-20')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Laikipia',
           NormalizedName = N'laikipia', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-20';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-20', N'KE', 'KE', N'Laikipia', N'laikipia',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-21')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Lamu',
           NormalizedName = N'lamu', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-21';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-21', N'KE', 'KE', N'Lamu', N'lamu',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-22')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Machakos',
           NormalizedName = N'machakos', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-22';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-22', N'KE', 'KE', N'Machakos', N'machakos',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-23')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Makueni',
           NormalizedName = N'makueni', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-23';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-23', N'KE', 'KE', N'Makueni', N'makueni',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-24')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Mandera',
           NormalizedName = N'mandera', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-24';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-24', N'KE', 'KE', N'Mandera', N'mandera',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-25')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Marsabit',
           NormalizedName = N'marsabit', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-25';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-25', N'KE', 'KE', N'Marsabit', N'marsabit',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-26')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Meru',
           NormalizedName = N'meru', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-26';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-26', N'KE', 'KE', N'Meru', N'meru',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-27')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Migori',
           NormalizedName = N'migori', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-27';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-27', N'KE', 'KE', N'Migori', N'migori',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-28')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Mombasa',
           NormalizedName = N'mombasa', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-28';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-28', N'KE', 'KE', N'Mombasa', N'mombasa',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-29')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Murang''a',
           NormalizedName = N'murang''a', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-29';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-29', N'KE', 'KE', N'Murang''a', N'murang''a',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-30')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Nairobi City',
           NormalizedName = N'nairobi city', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = N'Nairobi', Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-30';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-30', N'KE', 'KE', N'Nairobi City', N'nairobi city',
            'ADMIN1', 1, N'Nairobi', NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-31')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Nakuru',
           NormalizedName = N'nakuru', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-31';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-31', N'KE', 'KE', N'Nakuru', N'nakuru',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-32')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Nandi',
           NormalizedName = N'nandi', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-32';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-32', N'KE', 'KE', N'Nandi', N'nandi',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-33')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Narok',
           NormalizedName = N'narok', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-33';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-33', N'KE', 'KE', N'Narok', N'narok',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-34')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Nyamira',
           NormalizedName = N'nyamira', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-34';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-34', N'KE', 'KE', N'Nyamira', N'nyamira',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-35')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Nyandarua',
           NormalizedName = N'nyandarua', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-35';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-35', N'KE', 'KE', N'Nyandarua', N'nyandarua',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-36')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Nyeri',
           NormalizedName = N'nyeri', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-36';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-36', N'KE', 'KE', N'Nyeri', N'nyeri',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-37')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Samburu',
           NormalizedName = N'samburu', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-37';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-37', N'KE', 'KE', N'Samburu', N'samburu',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-38')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Siaya',
           NormalizedName = N'siaya', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-38';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-38', N'KE', 'KE', N'Siaya', N'siaya',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-39')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Taita-Taveta',
           NormalizedName = N'taita-taveta', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-39';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-39', N'KE', 'KE', N'Taita-Taveta', N'taita-taveta',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-40')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Tana River',
           NormalizedName = N'tana river', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-40';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-40', N'KE', 'KE', N'Tana River', N'tana river',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-41')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Tharaka-Nithi',
           NormalizedName = N'tharaka-nithi', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-41';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-41', N'KE', 'KE', N'Tharaka-Nithi', N'tharaka-nithi',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-42')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Trans Nzoia',
           NormalizedName = N'trans nzoia', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-42';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-42', N'KE', 'KE', N'Trans Nzoia', N'trans nzoia',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-43')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Turkana',
           NormalizedName = N'turkana', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-43';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-43', N'KE', 'KE', N'Turkana', N'turkana',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-44')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Uasin Gishu',
           NormalizedName = N'uasin gishu', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-44';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-44', N'KE', 'KE', N'Uasin Gishu', N'uasin gishu',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-45')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Vihiga',
           NormalizedName = N'vihiga', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-45';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-45', N'KE', 'KE', N'Vihiga', N'vihiga',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-46')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'Wajir',
           NormalizedName = N'wajir', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-46';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-46', N'KE', 'KE', N'Wajir', N'wajir',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-47')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE', CountryCode = 'KE', Name = N'West Pokot',
           NormalizedName = N'west pokot', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-47';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-47', N'KE', 'KE', N'West Pokot', N'west pokot',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-30-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30', CountryCode = 'KE', Name = N'Nairobi',
           NormalizedName = N'nairobi', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-30-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-30-CITY-01', N'KE-COUNTY-30', 'KE', N'Nairobi', N'nairobi',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-30-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30', CountryCode = 'KE', Name = N'Thika Road/Ruiru',
           NormalizedName = N'thika road/ruiru', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-30-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-30-CITY-02', N'KE-COUNTY-30', 'KE', N'Thika Road/Ruiru', N'thika road/ruiru',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-30-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30', CountryCode = 'KE', Name = N'Ngong',
           NormalizedName = N'ngong', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-30-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-30-CITY-03', N'KE-COUNTY-30', 'KE', N'Ngong', N'ngong',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-30-CITY-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30', CountryCode = 'KE', Name = N'Karen',
           NormalizedName = N'karen', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-30-CITY-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-30-CITY-04', N'KE-COUNTY-30', 'KE', N'Karen', N'karen',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-30-CITY-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30', CountryCode = 'KE', Name = N'Westlands',
           NormalizedName = N'westlands', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-30-CITY-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-30-CITY-05', N'KE-COUNTY-30', 'KE', N'Westlands', N'westlands',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-28-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-28', CountryCode = 'KE', Name = N'Mombasa',
           NormalizedName = N'mombasa', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-28-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-28-CITY-01', N'KE-COUNTY-28', 'KE', N'Mombasa', N'mombasa',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-28-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-28', CountryCode = 'KE', Name = N'Likoni',
           NormalizedName = N'likoni', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-28-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-28-CITY-02', N'KE-COUNTY-28', 'KE', N'Likoni', N'likoni',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-28-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-28', CountryCode = 'KE', Name = N'Changamwe',
           NormalizedName = N'changamwe', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-28-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-28-CITY-03', N'KE-COUNTY-28', 'KE', N'Changamwe', N'changamwe',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-28-CITY-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-28', CountryCode = 'KE', Name = N'Kisauni',
           NormalizedName = N'kisauni', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-28-CITY-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-28-CITY-04', N'KE-COUNTY-28', 'KE', N'Kisauni', N'kisauni',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-28-CITY-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-28', CountryCode = 'KE', Name = N'Nyali',
           NormalizedName = N'nyali', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-28-CITY-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-28-CITY-05', N'KE-COUNTY-28', 'KE', N'Nyali', N'nyali',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-13-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-13', CountryCode = 'KE', Name = N'Kiambu',
           NormalizedName = N'kiambu', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-13-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-13-CITY-01', N'KE-COUNTY-13', 'KE', N'Kiambu', N'kiambu',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-13-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-13', CountryCode = 'KE', Name = N'Thika',
           NormalizedName = N'thika', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-13-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-13-CITY-02', N'KE-COUNTY-13', 'KE', N'Thika', N'thika',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-13-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-13', CountryCode = 'KE', Name = N'Ruiru',
           NormalizedName = N'ruiru', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-13-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-13-CITY-03', N'KE-COUNTY-13', 'KE', N'Ruiru', N'ruiru',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-13-CITY-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-13', CountryCode = 'KE', Name = N'Kikuyu',
           NormalizedName = N'kikuyu', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-13-CITY-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-13-CITY-04', N'KE-COUNTY-13', 'KE', N'Kikuyu', N'kikuyu',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-13-CITY-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-13', CountryCode = 'KE', Name = N'Limuru',
           NormalizedName = N'limuru', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-13-CITY-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-13-CITY-05', N'KE-COUNTY-13', 'KE', N'Limuru', N'limuru',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-13-CITY-06')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-13', CountryCode = 'KE', Name = N'Juja',
           NormalizedName = N'juja', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-13-CITY-06';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-13-CITY-06', N'KE-COUNTY-13', 'KE', N'Juja', N'juja',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-17-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-17', CountryCode = 'KE', Name = N'Kisumu',
           NormalizedName = N'kisumu', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-17-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-17-CITY-01', N'KE-COUNTY-17', 'KE', N'Kisumu', N'kisumu',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-17-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-17', CountryCode = 'KE', Name = N'Ahero',
           NormalizedName = N'ahero', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-17-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-17-CITY-02', N'KE-COUNTY-17', 'KE', N'Ahero', N'ahero',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-17-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-17', CountryCode = 'KE', Name = N'Maseno',
           NormalizedName = N'maseno', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-17-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-17-CITY-03', N'KE-COUNTY-17', 'KE', N'Maseno', N'maseno',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-31-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-31', CountryCode = 'KE', Name = N'Nakuru',
           NormalizedName = N'nakuru', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-31-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-31-CITY-01', N'KE-COUNTY-31', 'KE', N'Nakuru', N'nakuru',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-31-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-31', CountryCode = 'KE', Name = N'Naivasha',
           NormalizedName = N'naivasha', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-31-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-31-CITY-02', N'KE-COUNTY-31', 'KE', N'Naivasha', N'naivasha',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-31-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-31', CountryCode = 'KE', Name = N'Gilgil',
           NormalizedName = N'gilgil', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-31-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-31-CITY-03', N'KE-COUNTY-31', 'KE', N'Gilgil', N'gilgil',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-31-CITY-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-31', CountryCode = 'KE', Name = N'Molo',
           NormalizedName = N'molo', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-31-CITY-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-31-CITY-04', N'KE-COUNTY-31', 'KE', N'Molo', N'molo',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-44-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-44', CountryCode = 'KE', Name = N'Eldoret',
           NormalizedName = N'eldoret', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-44-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-44-CITY-01', N'KE-COUNTY-44', 'KE', N'Eldoret', N'eldoret',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-44-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-44', CountryCode = 'KE', Name = N'Turbo',
           NormalizedName = N'turbo', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-44-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-44-CITY-02', N'KE-COUNTY-44', 'KE', N'Turbo', N'turbo',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-44-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-44', CountryCode = 'KE', Name = N'Burnt Forest',
           NormalizedName = N'burnt forest', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-44-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-44-CITY-03', N'KE-COUNTY-44', 'KE', N'Burnt Forest', N'burnt forest',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-22-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-22', CountryCode = 'KE', Name = N'Machakos',
           NormalizedName = N'machakos', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-22-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-22-CITY-01', N'KE-COUNTY-22', 'KE', N'Machakos', N'machakos',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-22-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-22', CountryCode = 'KE', Name = N'Athi River',
           NormalizedName = N'athi river', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-22-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-22-CITY-02', N'KE-COUNTY-22', 'KE', N'Athi River', N'athi river',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-22-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-22', CountryCode = 'KE', Name = N'Mlolongo',
           NormalizedName = N'mlolongo', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-22-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-22-CITY-03', N'KE-COUNTY-22', 'KE', N'Mlolongo', N'mlolongo',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-22-CITY-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-22', CountryCode = 'KE', Name = N'Kangundo',
           NormalizedName = N'kangundo', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-22-CITY-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-22-CITY-04', N'KE-COUNTY-22', 'KE', N'Kangundo', N'kangundo',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-10-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-10', CountryCode = 'KE', Name = N'Kajiado',
           NormalizedName = N'kajiado', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-10-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-10-CITY-01', N'KE-COUNTY-10', 'KE', N'Kajiado', N'kajiado',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-10-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-10', CountryCode = 'KE', Name = N'Kitengela',
           NormalizedName = N'kitengela', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-10-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-10-CITY-02', N'KE-COUNTY-10', 'KE', N'Kitengela', N'kitengela',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-10-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-10', CountryCode = 'KE', Name = N'Ongata Rongai',
           NormalizedName = N'ongata rongai', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-10-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-10-CITY-03', N'KE-COUNTY-10', 'KE', N'Ongata Rongai', N'ongata rongai',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-10-CITY-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-10', CountryCode = 'KE', Name = N'Ngong',
           NormalizedName = N'ngong', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-10-CITY-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-10-CITY-04', N'KE-COUNTY-10', 'KE', N'Ngong', N'ngong',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-14-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-14', CountryCode = 'KE', Name = N'Kilifi',
           NormalizedName = N'kilifi', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-14-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-14-CITY-01', N'KE-COUNTY-14', 'KE', N'Kilifi', N'kilifi',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-14-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-14', CountryCode = 'KE', Name = N'Malindi',
           NormalizedName = N'malindi', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-14-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-14-CITY-02', N'KE-COUNTY-14', 'KE', N'Malindi', N'malindi',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-14-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-14', CountryCode = 'KE', Name = N'Watamu',
           NormalizedName = N'watamu', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-14-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-14-CITY-03', N'KE-COUNTY-14', 'KE', N'Watamu', N'watamu',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-14-CITY-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-14', CountryCode = 'KE', Name = N'Mtwapa',
           NormalizedName = N'mtwapa', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-14-CITY-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-14-CITY-04', N'KE-COUNTY-14', 'KE', N'Mtwapa', N'mtwapa',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-36-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-36', CountryCode = 'KE', Name = N'Nyeri',
           NormalizedName = N'nyeri', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-36-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-36-CITY-01', N'KE-COUNTY-36', 'KE', N'Nyeri', N'nyeri',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-36-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-36', CountryCode = 'KE', Name = N'Karatina',
           NormalizedName = N'karatina', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-36-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-36-CITY-02', N'KE-COUNTY-36', 'KE', N'Karatina', N'karatina',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-36-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-36', CountryCode = 'KE', Name = N'Othaya',
           NormalizedName = N'othaya', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-36-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-36-CITY-03', N'KE-COUNTY-36', 'KE', N'Othaya', N'othaya',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-26-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-26', CountryCode = 'KE', Name = N'Meru',
           NormalizedName = N'meru', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-26-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-26-CITY-01', N'KE-COUNTY-26', 'KE', N'Meru', N'meru',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-26-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-26', CountryCode = 'KE', Name = N'Maua',
           NormalizedName = N'maua', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-26-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-26-CITY-02', N'KE-COUNTY-26', 'KE', N'Maua', N'maua',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-26-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-26', CountryCode = 'KE', Name = N'Nkubu',
           NormalizedName = N'nkubu', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-26-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-26-CITY-03', N'KE-COUNTY-26', 'KE', N'Nkubu', N'nkubu',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-11-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-11', CountryCode = 'KE', Name = N'Kakamega',
           NormalizedName = N'kakamega', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-11-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-11-CITY-01', N'KE-COUNTY-11', 'KE', N'Kakamega', N'kakamega',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-11-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-11', CountryCode = 'KE', Name = N'Mumias',
           NormalizedName = N'mumias', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-11-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-11-CITY-02', N'KE-COUNTY-11', 'KE', N'Mumias', N'mumias',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-07-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-07', CountryCode = 'KE', Name = N'Garissa',
           NormalizedName = N'garissa', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-07-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-07-CITY-01', N'KE-COUNTY-07', 'KE', N'Garissa', N'garissa',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-06-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-06', CountryCode = 'KE', Name = N'Embu',
           NormalizedName = N'embu', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-06-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-06-CITY-01', N'KE-COUNTY-06', 'KE', N'Embu', N'embu',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-06-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-06', CountryCode = 'KE', Name = N'Runyenjes',
           NormalizedName = N'runyenjes', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-06-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-06-CITY-02', N'KE-COUNTY-06', 'KE', N'Runyenjes', N'runyenjes',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-12-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-12', CountryCode = 'KE', Name = N'Kericho',
           NormalizedName = N'kericho', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-12-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-12-CITY-01', N'KE-COUNTY-12', 'KE', N'Kericho', N'kericho',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-12-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-12', CountryCode = 'KE', Name = N'Litein',
           NormalizedName = N'litein', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-12-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-12-CITY-02', N'KE-COUNTY-12', 'KE', N'Litein', N'litein',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-18-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-18', CountryCode = 'KE', Name = N'Kitui',
           NormalizedName = N'kitui', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-18-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-18-CITY-01', N'KE-COUNTY-18', 'KE', N'Kitui', N'kitui',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-18-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-18', CountryCode = 'KE', Name = N'Mwingi',
           NormalizedName = N'mwingi', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-18-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-18-CITY-02', N'KE-COUNTY-18', 'KE', N'Mwingi', N'mwingi',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-19-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-19', CountryCode = 'KE', Name = N'Ukunda',
           NormalizedName = N'ukunda', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-19-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-19-CITY-01', N'KE-COUNTY-19', 'KE', N'Ukunda', N'ukunda',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-19-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-19', CountryCode = 'KE', Name = N'Diani',
           NormalizedName = N'diani', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-19-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-19-CITY-02', N'KE-COUNTY-19', 'KE', N'Diani', N'diani',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-19-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-19', CountryCode = 'KE', Name = N'Kwale',
           NormalizedName = N'kwale', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-19-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-19-CITY-03', N'KE-COUNTY-19', 'KE', N'Kwale', N'kwale',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-20-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-20', CountryCode = 'KE', Name = N'Nanyuki',
           NormalizedName = N'nanyuki', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-20-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-20-CITY-01', N'KE-COUNTY-20', 'KE', N'Nanyuki', N'nanyuki',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-20-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-20', CountryCode = 'KE', Name = N'Nyahururu',
           NormalizedName = N'nyahururu', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-20-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-20-CITY-02', N'KE-COUNTY-20', 'KE', N'Nyahururu', N'nyahururu',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-33-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-33', CountryCode = 'KE', Name = N'Narok',
           NormalizedName = N'narok', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-33-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-33-CITY-01', N'KE-COUNTY-33', 'KE', N'Narok', N'narok',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-33-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-33', CountryCode = 'KE', Name = N'Kilgoris',
           NormalizedName = N'kilgoris', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-33-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-33-CITY-02', N'KE-COUNTY-33', 'KE', N'Kilgoris', N'kilgoris',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-04-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-04', CountryCode = 'KE', Name = N'Busia',
           NormalizedName = N'busia', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-04-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-04-CITY-01', N'KE-COUNTY-04', 'KE', N'Busia', N'busia',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-04-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-04', CountryCode = 'KE', Name = N'Malaba',
           NormalizedName = N'malaba', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-04-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-04-CITY-02', N'KE-COUNTY-04', 'KE', N'Malaba', N'malaba',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-03-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-03', CountryCode = 'KE', Name = N'Bungoma',
           NormalizedName = N'bungoma', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-03-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-03-CITY-01', N'KE-COUNTY-03', 'KE', N'Bungoma', N'bungoma',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-03-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-03', CountryCode = 'KE', Name = N'Webuye',
           NormalizedName = N'webuye', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-03-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-03-CITY-02', N'KE-COUNTY-03', 'KE', N'Webuye', N'webuye',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-29-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-29', CountryCode = 'KE', Name = N'Murang''a',
           NormalizedName = N'murang''a', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-29-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-29-CITY-01', N'KE-COUNTY-29', 'KE', N'Murang''a', N'murang''a',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-29-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-29', CountryCode = 'KE', Name = N'Kenol',
           NormalizedName = N'kenol', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-29-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-29-CITY-02', N'KE-COUNTY-29', 'KE', N'Kenol', N'kenol',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-38-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-38', CountryCode = 'KE', Name = N'Siaya',
           NormalizedName = N'siaya', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-38-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-38-CITY-01', N'KE-COUNTY-38', 'KE', N'Siaya', N'siaya',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-38-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-38', CountryCode = 'KE', Name = N'Bondo',
           NormalizedName = N'bondo', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-38-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-38-CITY-02', N'KE-COUNTY-38', 'KE', N'Bondo', N'bondo',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-35-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-35', CountryCode = 'KE', Name = N'Ol Kalou',
           NormalizedName = N'ol kalou', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-35-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-35-CITY-01', N'KE-COUNTY-35', 'KE', N'Ol Kalou', N'ol kalou',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-35-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-35', CountryCode = 'KE', Name = N'Engineer',
           NormalizedName = N'engineer', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-35-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-35-CITY-02', N'KE-COUNTY-35', 'KE', N'Engineer', N'engineer',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-42-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-42', CountryCode = 'KE', Name = N'Kitale',
           NormalizedName = N'kitale', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-42-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-42-CITY-01', N'KE-COUNTY-42', 'KE', N'Kitale', N'kitale',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-27-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-27', CountryCode = 'KE', Name = N'Migori',
           NormalizedName = N'migori', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-27-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-27-CITY-01', N'KE-COUNTY-27', 'KE', N'Migori', N'migori',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-27-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-27', CountryCode = 'KE', Name = N'Rongo',
           NormalizedName = N'rongo', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-27-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-27-CITY-02', N'KE-COUNTY-27', 'KE', N'Rongo', N'rongo',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-08-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-08', CountryCode = 'KE', Name = N'Homa Bay',
           NormalizedName = N'homa bay', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-08-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-08-CITY-01', N'KE-COUNTY-08', 'KE', N'Homa Bay', N'homa bay',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-08-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-08', CountryCode = 'KE', Name = N'Oyugis',
           NormalizedName = N'oyugis', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-08-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-08-CITY-02', N'KE-COUNTY-08', 'KE', N'Oyugis', N'oyugis',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-45-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-45', CountryCode = 'KE', Name = N'Mbale',
           NormalizedName = N'mbale', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-45-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-45-CITY-01', N'KE-COUNTY-45', 'KE', N'Mbale', N'mbale',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-45-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-45', CountryCode = 'KE', Name = N'Luanda',
           NormalizedName = N'luanda', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-45-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-45-CITY-02', N'KE-COUNTY-45', 'KE', N'Luanda', N'luanda',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-24-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-24', CountryCode = 'KE', Name = N'Mandera',
           NormalizedName = N'mandera', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-24-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-24-CITY-01', N'KE-COUNTY-24', 'KE', N'Mandera', N'mandera',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-46-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-46', CountryCode = 'KE', Name = N'Wajir',
           NormalizedName = N'wajir', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-46-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-46-CITY-01', N'KE-COUNTY-46', 'KE', N'Wajir', N'wajir',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-25-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-25', CountryCode = 'KE', Name = N'Marsabit',
           NormalizedName = N'marsabit', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-25-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-25-CITY-01', N'KE-COUNTY-25', 'KE', N'Marsabit', N'marsabit',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-09-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-09', CountryCode = 'KE', Name = N'Isiolo',
           NormalizedName = N'isiolo', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-09-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-09-CITY-01', N'KE-COUNTY-09', 'KE', N'Isiolo', N'isiolo',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-43-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-43', CountryCode = 'KE', Name = N'Lodwar',
           NormalizedName = N'lodwar', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-43-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-43-CITY-01', N'KE-COUNTY-43', 'KE', N'Lodwar', N'lodwar',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-43-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-43', CountryCode = 'KE', Name = N'Kakuma',
           NormalizedName = N'kakuma', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-43-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-43-CITY-02', N'KE-COUNTY-43', 'KE', N'Kakuma', N'kakuma',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-47-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-47', CountryCode = 'KE', Name = N'Kapenguria',
           NormalizedName = N'kapenguria', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-47-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-47-CITY-01', N'KE-COUNTY-47', 'KE', N'Kapenguria', N'kapenguria',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-01-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-01', CountryCode = 'KE', Name = N'Kabarnet',
           NormalizedName = N'kabarnet', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-01-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-01-CITY-01', N'KE-COUNTY-01', 'KE', N'Kabarnet', N'kabarnet',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-01-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-01', CountryCode = 'KE', Name = N'Eldama Ravine',
           NormalizedName = N'eldama ravine', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-01-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-01-CITY-02', N'KE-COUNTY-01', 'KE', N'Eldama Ravine', N'eldama ravine',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-02-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-02', CountryCode = 'KE', Name = N'Bomet',
           NormalizedName = N'bomet', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-02-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-02-CITY-01', N'KE-COUNTY-02', 'KE', N'Bomet', N'bomet',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-15-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-15', CountryCode = 'KE', Name = N'Kerugoya',
           NormalizedName = N'kerugoya', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-15-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-15-CITY-01', N'KE-COUNTY-15', 'KE', N'Kerugoya', N'kerugoya',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-15-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-15', CountryCode = 'KE', Name = N'Kutus',
           NormalizedName = N'kutus', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-15-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-15-CITY-02', N'KE-COUNTY-15', 'KE', N'Kutus', N'kutus',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-16-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-16', CountryCode = 'KE', Name = N'Kisii',
           NormalizedName = N'kisii', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-16-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-16-CITY-01', N'KE-COUNTY-16', 'KE', N'Kisii', N'kisii',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-16-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-16', CountryCode = 'KE', Name = N'Ogembo',
           NormalizedName = N'ogembo', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-16-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-16-CITY-02', N'KE-COUNTY-16', 'KE', N'Ogembo', N'ogembo',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-34-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-34', CountryCode = 'KE', Name = N'Nyamira',
           NormalizedName = N'nyamira', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-34-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-34-CITY-01', N'KE-COUNTY-34', 'KE', N'Nyamira', N'nyamira',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-05-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-05', CountryCode = 'KE', Name = N'Iten',
           NormalizedName = N'iten', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-05-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-05-CITY-01', N'KE-COUNTY-05', 'KE', N'Iten', N'iten',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-39-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-39', CountryCode = 'KE', Name = N'Voi',
           NormalizedName = N'voi', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-39-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-39-CITY-01', N'KE-COUNTY-39', 'KE', N'Voi', N'voi',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-39-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-39', CountryCode = 'KE', Name = N'Taveta',
           NormalizedName = N'taveta', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-39-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-39-CITY-02', N'KE-COUNTY-39', 'KE', N'Taveta', N'taveta',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-39-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-39', CountryCode = 'KE', Name = N'Wundanyi',
           NormalizedName = N'wundanyi', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-39-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-39-CITY-03', N'KE-COUNTY-39', 'KE', N'Wundanyi', N'wundanyi',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-40-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-40', CountryCode = 'KE', Name = N'Hola',
           NormalizedName = N'hola', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-40-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-40-CITY-01', N'KE-COUNTY-40', 'KE', N'Hola', N'hola',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-41-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-41', CountryCode = 'KE', Name = N'Chuka',
           NormalizedName = N'chuka', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-41-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-41-CITY-01', N'KE-COUNTY-41', 'KE', N'Chuka', N'chuka',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-41-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-41', CountryCode = 'KE', Name = N'Marimanti',
           NormalizedName = N'marimanti', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-41-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-41-CITY-02', N'KE-COUNTY-41', 'KE', N'Marimanti', N'marimanti',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-37-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-37', CountryCode = 'KE', Name = N'Maralal',
           NormalizedName = N'maralal', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-37-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-37-CITY-01', N'KE-COUNTY-37', 'KE', N'Maralal', N'maralal',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-32-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-32', CountryCode = 'KE', Name = N'Kapsabet',
           NormalizedName = N'kapsabet', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-32-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-32-CITY-01', N'KE-COUNTY-32', 'KE', N'Kapsabet', N'kapsabet',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-23-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-23', CountryCode = 'KE', Name = N'Wote',
           NormalizedName = N'wote', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-23-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-23-CITY-01', N'KE-COUNTY-23', 'KE', N'Wote', N'wote',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-COUNTY-21-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-21', CountryCode = 'KE', Name = N'Lamu',
           NormalizedName = N'lamu', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-COUNTY-21-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-COUNTY-21-CITY-01', N'KE-COUNTY-21', 'KE', N'Lamu', N'lamu',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'Westlands',
           NormalizedName = N'westlands', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-01', N'KE-COUNTY-30-CITY-01', 'KE', N'Westlands', N'westlands',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'Parklands',
           NormalizedName = N'parklands', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-02', N'KE-COUNTY-30-CITY-01', 'KE', N'Parklands', N'parklands',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'Kilimani',
           NormalizedName = N'kilimani', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-03', N'KE-COUNTY-30-CITY-01', 'KE', N'Kilimani', N'kilimani',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'Kileleshwa',
           NormalizedName = N'kileleshwa', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-04', N'KE-COUNTY-30-CITY-01', 'KE', N'Kileleshwa', N'kileleshwa',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'Lavington',
           NormalizedName = N'lavington', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-05', N'KE-COUNTY-30-CITY-01', 'KE', N'Lavington', N'lavington',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-06')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'Karen',
           NormalizedName = N'karen', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-06';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-06', N'KE-COUNTY-30-CITY-01', 'KE', N'Karen', N'karen',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-07')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'Lang''ata',
           NormalizedName = N'lang''ata', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-07';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-07', N'KE-COUNTY-30-CITY-01', 'KE', N'Lang''ata', N'lang''ata',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-08')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'Runda',
           NormalizedName = N'runda', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-08';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-08', N'KE-COUNTY-30-CITY-01', 'KE', N'Runda', N'runda',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-09')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'Muthaiga',
           NormalizedName = N'muthaiga', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-09';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-09', N'KE-COUNTY-30-CITY-01', 'KE', N'Muthaiga', N'muthaiga',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-10')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'Eastleigh',
           NormalizedName = N'eastleigh', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-10';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-10', N'KE-COUNTY-30-CITY-01', 'KE', N'Eastleigh', N'eastleigh',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-11')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'South B',
           NormalizedName = N'south b', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-11';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-11', N'KE-COUNTY-30-CITY-01', 'KE', N'South B', N'south b',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-12')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'South C',
           NormalizedName = N'south c', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-12';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-12', N'KE-COUNTY-30-CITY-01', 'KE', N'South C', N'south c',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-13')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'Embakasi',
           NormalizedName = N'embakasi', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-13';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-13', N'KE-COUNTY-30-CITY-01', 'KE', N'Embakasi', N'embakasi',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-14')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'Kasarani',
           NormalizedName = N'kasarani', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-14';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-14', N'KE-COUNTY-30-CITY-01', 'KE', N'Kasarani', N'kasarani',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-15')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'Roysambu',
           NormalizedName = N'roysambu', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-15';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-15', N'KE-COUNTY-30-CITY-01', 'KE', N'Roysambu', N'roysambu',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-16')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'Ngara',
           NormalizedName = N'ngara', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-16';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-16', N'KE-COUNTY-30-CITY-01', 'KE', N'Ngara', N'ngara',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-17')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'CBD',
           NormalizedName = N'cbd', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-17';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-17', N'KE-COUNTY-30-CITY-01', 'KE', N'CBD', N'cbd',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-18')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'Gigiri',
           NormalizedName = N'gigiri', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-18';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-18', N'KE-COUNTY-30-CITY-01', 'KE', N'Gigiri', N'gigiri',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-19')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'Upper Hill',
           NormalizedName = N'upper hill', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-19';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-19', N'KE-COUNTY-30-CITY-01', 'KE', N'Upper Hill', N'upper hill',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-20')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'Hurlingham',
           NormalizedName = N'hurlingham', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-20';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-20', N'KE-COUNTY-30-CITY-01', 'KE', N'Hurlingham', N'hurlingham',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-21')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'Donholm',
           NormalizedName = N'donholm', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-21';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-21', N'KE-COUNTY-30-CITY-01', 'KE', N'Donholm', N'donholm',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-22')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'Buruburu',
           NormalizedName = N'buruburu', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-22';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-22', N'KE-COUNTY-30-CITY-01', 'KE', N'Buruburu', N'buruburu',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-23')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'Umoja',
           NormalizedName = N'umoja', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-23';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-23', N'KE-COUNTY-30-CITY-01', 'KE', N'Umoja', N'umoja',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-NAIROBI-NBH-24')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-30-CITY-01', CountryCode = 'KE', Name = N'Kangemi',
           NormalizedName = N'kangemi', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-NAIROBI-NBH-24';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-NAIROBI-NBH-24', N'KE-COUNTY-30-CITY-01', 'KE', N'Kangemi', N'kangemi',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-MSA-NBH-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-28-CITY-01', CountryCode = 'KE', Name = N'Nyali',
           NormalizedName = N'nyali', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-MSA-NBH-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-MSA-NBH-01', N'KE-COUNTY-28-CITY-01', 'KE', N'Nyali', N'nyali',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-MSA-NBH-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-28-CITY-01', CountryCode = 'KE', Name = N'Bamburi',
           NormalizedName = N'bamburi', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-MSA-NBH-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-MSA-NBH-02', N'KE-COUNTY-28-CITY-01', 'KE', N'Bamburi', N'bamburi',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-MSA-NBH-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-28-CITY-01', CountryCode = 'KE', Name = N'Kizingo',
           NormalizedName = N'kizingo', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-MSA-NBH-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-MSA-NBH-03', N'KE-COUNTY-28-CITY-01', 'KE', N'Kizingo', N'kizingo',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-MSA-NBH-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-28-CITY-01', CountryCode = 'KE', Name = N'Mtwapa',
           NormalizedName = N'mtwapa', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-MSA-NBH-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-MSA-NBH-04', N'KE-COUNTY-28-CITY-01', 'KE', N'Mtwapa', N'mtwapa',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-MSA-NBH-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-28-CITY-01', CountryCode = 'KE', Name = N'Shanzu',
           NormalizedName = N'shanzu', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-MSA-NBH-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-MSA-NBH-05', N'KE-COUNTY-28-CITY-01', 'KE', N'Shanzu', N'shanzu',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-MSA-NBH-06')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-28-CITY-01', CountryCode = 'KE', Name = N'Likoni',
           NormalizedName = N'likoni', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-MSA-NBH-06';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-MSA-NBH-06', N'KE-COUNTY-28-CITY-01', 'KE', N'Likoni', N'likoni',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-MSA-NBH-07')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-28-CITY-01', CountryCode = 'KE', Name = N'Tudor',
           NormalizedName = N'tudor', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-MSA-NBH-07';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-MSA-NBH-07', N'KE-COUNTY-28-CITY-01', 'KE', N'Tudor', N'tudor',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-MSA-NBH-08')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-28-CITY-01', CountryCode = 'KE', Name = N'Kisauni',
           NormalizedName = N'kisauni', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-MSA-NBH-08';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-MSA-NBH-08', N'KE-COUNTY-28-CITY-01', 'KE', N'Kisauni', N'kisauni',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-MSA-NBH-09')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-28-CITY-01', CountryCode = 'KE', Name = N'Changamwe',
           NormalizedName = N'changamwe', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-MSA-NBH-09';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-MSA-NBH-09', N'KE-COUNTY-28-CITY-01', 'KE', N'Changamwe', N'changamwe',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-MSA-NBH-10')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-28-CITY-01', CountryCode = 'KE', Name = N'Old Town',
           NormalizedName = N'old town', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-MSA-NBH-10';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-MSA-NBH-10', N'KE-COUNTY-28-CITY-01', 'KE', N'Old Town', N'old town',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'KE-MSA-NBH-11')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'KE-COUNTY-28-CITY-01', CountryCode = 'KE', Name = N'Mkomani',
           NormalizedName = N'mkomani', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'KE-MSA-NBH-11';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'KE-MSA-NBH-11', N'KE-COUNTY-28-CITY-01', 'KE', N'Mkomani', N'mkomani',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW', CountryCode = 'RW', Name = N'Kigali City',
           NormalizedName = N'kigali city', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = N'Kigali', Notes = NULL
     WHERE LocationCode = N'RW-PROV-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-01', N'RW', 'RW', N'Kigali City', N'kigali city',
            'ADMIN1', 1, N'Kigali', NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-01-DIST-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-01', CountryCode = 'RW', Name = N'Nyarugenge',
           NormalizedName = N'nyarugenge', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-01-DIST-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-01-DIST-01', N'RW-PROV-01', 'RW', N'Nyarugenge', N'nyarugenge',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-01-DIST-01-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-01-DIST-01', CountryCode = 'RW', Name = N'Kigali',
           NormalizedName = N'kigali', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-01-DIST-01-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-01-DIST-01-CITY-01', N'RW-PROV-01-DIST-01', 'RW', N'Kigali', N'kigali',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-01-DIST-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-01', CountryCode = 'RW', Name = N'Gasabo',
           NormalizedName = N'gasabo', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-01-DIST-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-01-DIST-02', N'RW-PROV-01', 'RW', N'Gasabo', N'gasabo',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-01-DIST-02-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-01-DIST-02', CountryCode = 'RW', Name = N'Kigali',
           NormalizedName = N'kigali', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-01-DIST-02-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-01-DIST-02-CITY-01', N'RW-PROV-01-DIST-02', 'RW', N'Kigali', N'kigali',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-01-DIST-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-01', CountryCode = 'RW', Name = N'Kicukiro',
           NormalizedName = N'kicukiro', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-01-DIST-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-01-DIST-03', N'RW-PROV-01', 'RW', N'Kicukiro', N'kicukiro',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-01-DIST-03-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-01-DIST-03', CountryCode = 'RW', Name = N'Kigali',
           NormalizedName = N'kigali', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-01-DIST-03-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-01-DIST-03-CITY-01', N'RW-PROV-01-DIST-03', 'RW', N'Kigali', N'kigali',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW', CountryCode = 'RW', Name = N'Eastern Province',
           NormalizedName = N'eastern province', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-02', N'RW', 'RW', N'Eastern Province', N'eastern province',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-02-DIST-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-02', CountryCode = 'RW', Name = N'Nyagatare',
           NormalizedName = N'nyagatare', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-02-DIST-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-02-DIST-01', N'RW-PROV-02', 'RW', N'Nyagatare', N'nyagatare',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-02-DIST-01-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-02-DIST-01', CountryCode = 'RW', Name = N'Nyagatare',
           NormalizedName = N'nyagatare', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-02-DIST-01-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-02-DIST-01-CITY-01', N'RW-PROV-02-DIST-01', 'RW', N'Nyagatare', N'nyagatare',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-02-DIST-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-02', CountryCode = 'RW', Name = N'Gatsibo',
           NormalizedName = N'gatsibo', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-02-DIST-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-02-DIST-02', N'RW-PROV-02', 'RW', N'Gatsibo', N'gatsibo',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-02-DIST-02-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-02-DIST-02', CountryCode = 'RW', Name = N'Gatsibo',
           NormalizedName = N'gatsibo', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-02-DIST-02-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-02-DIST-02-CITY-01', N'RW-PROV-02-DIST-02', 'RW', N'Gatsibo', N'gatsibo',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-02-DIST-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-02', CountryCode = 'RW', Name = N'Kayonza',
           NormalizedName = N'kayonza', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-02-DIST-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-02-DIST-03', N'RW-PROV-02', 'RW', N'Kayonza', N'kayonza',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-02-DIST-03-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-02-DIST-03', CountryCode = 'RW', Name = N'Kayonza',
           NormalizedName = N'kayonza', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-02-DIST-03-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-02-DIST-03-CITY-01', N'RW-PROV-02-DIST-03', 'RW', N'Kayonza', N'kayonza',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-02-DIST-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-02', CountryCode = 'RW', Name = N'Rwamagana',
           NormalizedName = N'rwamagana', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-02-DIST-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-02-DIST-04', N'RW-PROV-02', 'RW', N'Rwamagana', N'rwamagana',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-02-DIST-04-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-02-DIST-04', CountryCode = 'RW', Name = N'Rwamagana',
           NormalizedName = N'rwamagana', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-02-DIST-04-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-02-DIST-04-CITY-01', N'RW-PROV-02-DIST-04', 'RW', N'Rwamagana', N'rwamagana',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-02-DIST-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-02', CountryCode = 'RW', Name = N'Bugesera',
           NormalizedName = N'bugesera', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-02-DIST-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-02-DIST-05', N'RW-PROV-02', 'RW', N'Bugesera', N'bugesera',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-02-DIST-05-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-02-DIST-05', CountryCode = 'RW', Name = N'Bugesera',
           NormalizedName = N'bugesera', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-02-DIST-05-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-02-DIST-05-CITY-01', N'RW-PROV-02-DIST-05', 'RW', N'Bugesera', N'bugesera',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-02-DIST-06')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-02', CountryCode = 'RW', Name = N'Ngoma',
           NormalizedName = N'ngoma', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-02-DIST-06';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-02-DIST-06', N'RW-PROV-02', 'RW', N'Ngoma', N'ngoma',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-02-DIST-06-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-02-DIST-06', CountryCode = 'RW', Name = N'Ngoma',
           NormalizedName = N'ngoma', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-02-DIST-06-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-02-DIST-06-CITY-01', N'RW-PROV-02-DIST-06', 'RW', N'Ngoma', N'ngoma',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-02-DIST-07')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-02', CountryCode = 'RW', Name = N'Kirehe',
           NormalizedName = N'kirehe', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-02-DIST-07';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-02-DIST-07', N'RW-PROV-02', 'RW', N'Kirehe', N'kirehe',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-02-DIST-07-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-02-DIST-07', CountryCode = 'RW', Name = N'Kirehe',
           NormalizedName = N'kirehe', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-02-DIST-07-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-02-DIST-07-CITY-01', N'RW-PROV-02-DIST-07', 'RW', N'Kirehe', N'kirehe',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW', CountryCode = 'RW', Name = N'Northern Province',
           NormalizedName = N'northern province', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-03', N'RW', 'RW', N'Northern Province', N'northern province',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-03-DIST-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-03', CountryCode = 'RW', Name = N'Rulindo',
           NormalizedName = N'rulindo', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-03-DIST-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-03-DIST-01', N'RW-PROV-03', 'RW', N'Rulindo', N'rulindo',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-03-DIST-01-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-03-DIST-01', CountryCode = 'RW', Name = N'Rulindo',
           NormalizedName = N'rulindo', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-03-DIST-01-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-03-DIST-01-CITY-01', N'RW-PROV-03-DIST-01', 'RW', N'Rulindo', N'rulindo',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-03-DIST-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-03', CountryCode = 'RW', Name = N'Gakenke',
           NormalizedName = N'gakenke', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-03-DIST-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-03-DIST-02', N'RW-PROV-03', 'RW', N'Gakenke', N'gakenke',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-03-DIST-02-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-03-DIST-02', CountryCode = 'RW', Name = N'Gakenke',
           NormalizedName = N'gakenke', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-03-DIST-02-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-03-DIST-02-CITY-01', N'RW-PROV-03-DIST-02', 'RW', N'Gakenke', N'gakenke',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-03-DIST-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-03', CountryCode = 'RW', Name = N'Musanze',
           NormalizedName = N'musanze', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-03-DIST-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-03-DIST-03', N'RW-PROV-03', 'RW', N'Musanze', N'musanze',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-03-DIST-03-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-03-DIST-03', CountryCode = 'RW', Name = N'Musanze',
           NormalizedName = N'musanze', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-03-DIST-03-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-03-DIST-03-CITY-01', N'RW-PROV-03-DIST-03', 'RW', N'Musanze', N'musanze',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-03-DIST-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-03', CountryCode = 'RW', Name = N'Burera',
           NormalizedName = N'burera', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-03-DIST-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-03-DIST-04', N'RW-PROV-03', 'RW', N'Burera', N'burera',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-03-DIST-04-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-03-DIST-04', CountryCode = 'RW', Name = N'Burera',
           NormalizedName = N'burera', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-03-DIST-04-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-03-DIST-04-CITY-01', N'RW-PROV-03-DIST-04', 'RW', N'Burera', N'burera',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-03-DIST-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-03', CountryCode = 'RW', Name = N'Gicumbi',
           NormalizedName = N'gicumbi', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-03-DIST-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-03-DIST-05', N'RW-PROV-03', 'RW', N'Gicumbi', N'gicumbi',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-03-DIST-05-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-03-DIST-05', CountryCode = 'RW', Name = N'Gicumbi',
           NormalizedName = N'gicumbi', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-03-DIST-05-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-03-DIST-05-CITY-01', N'RW-PROV-03-DIST-05', 'RW', N'Gicumbi', N'gicumbi',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW', CountryCode = 'RW', Name = N'Southern Province',
           NormalizedName = N'southern province', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-04', N'RW', 'RW', N'Southern Province', N'southern province',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-04-DIST-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-04', CountryCode = 'RW', Name = N'Kamonyi',
           NormalizedName = N'kamonyi', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-04-DIST-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-04-DIST-01', N'RW-PROV-04', 'RW', N'Kamonyi', N'kamonyi',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-04-DIST-01-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-04-DIST-01', CountryCode = 'RW', Name = N'Kamonyi',
           NormalizedName = N'kamonyi', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-04-DIST-01-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-04-DIST-01-CITY-01', N'RW-PROV-04-DIST-01', 'RW', N'Kamonyi', N'kamonyi',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-04-DIST-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-04', CountryCode = 'RW', Name = N'Muhanga',
           NormalizedName = N'muhanga', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-04-DIST-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-04-DIST-02', N'RW-PROV-04', 'RW', N'Muhanga', N'muhanga',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-04-DIST-02-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-04-DIST-02', CountryCode = 'RW', Name = N'Muhanga / Gitarama',
           NormalizedName = N'muhanga / gitarama', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-04-DIST-02-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-04-DIST-02-CITY-01', N'RW-PROV-04-DIST-02', 'RW', N'Muhanga / Gitarama', N'muhanga / gitarama',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-04-DIST-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-04', CountryCode = 'RW', Name = N'Ruhango',
           NormalizedName = N'ruhango', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-04-DIST-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-04-DIST-03', N'RW-PROV-04', 'RW', N'Ruhango', N'ruhango',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-04-DIST-03-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-04-DIST-03', CountryCode = 'RW', Name = N'Ruhango',
           NormalizedName = N'ruhango', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-04-DIST-03-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-04-DIST-03-CITY-01', N'RW-PROV-04-DIST-03', 'RW', N'Ruhango', N'ruhango',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-04-DIST-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-04', CountryCode = 'RW', Name = N'Nyanza',
           NormalizedName = N'nyanza', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-04-DIST-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-04-DIST-04', N'RW-PROV-04', 'RW', N'Nyanza', N'nyanza',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-04-DIST-04-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-04-DIST-04', CountryCode = 'RW', Name = N'Nyanza',
           NormalizedName = N'nyanza', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-04-DIST-04-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-04-DIST-04-CITY-01', N'RW-PROV-04-DIST-04', 'RW', N'Nyanza', N'nyanza',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-04-DIST-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-04', CountryCode = 'RW', Name = N'Huye',
           NormalizedName = N'huye', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-04-DIST-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-04-DIST-05', N'RW-PROV-04', 'RW', N'Huye', N'huye',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-04-DIST-05-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-04-DIST-05', CountryCode = 'RW', Name = N'Huye / Butare',
           NormalizedName = N'huye / butare', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-04-DIST-05-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-04-DIST-05-CITY-01', N'RW-PROV-04-DIST-05', 'RW', N'Huye / Butare', N'huye / butare',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-04-DIST-06')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-04', CountryCode = 'RW', Name = N'Nyamagabe',
           NormalizedName = N'nyamagabe', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-04-DIST-06';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-04-DIST-06', N'RW-PROV-04', 'RW', N'Nyamagabe', N'nyamagabe',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-04-DIST-06-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-04-DIST-06', CountryCode = 'RW', Name = N'Nyamagabe',
           NormalizedName = N'nyamagabe', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-04-DIST-06-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-04-DIST-06-CITY-01', N'RW-PROV-04-DIST-06', 'RW', N'Nyamagabe', N'nyamagabe',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-04-DIST-07')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-04', CountryCode = 'RW', Name = N'Gisagara',
           NormalizedName = N'gisagara', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-04-DIST-07';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-04-DIST-07', N'RW-PROV-04', 'RW', N'Gisagara', N'gisagara',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-04-DIST-07-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-04-DIST-07', CountryCode = 'RW', Name = N'Gisagara',
           NormalizedName = N'gisagara', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-04-DIST-07-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-04-DIST-07-CITY-01', N'RW-PROV-04-DIST-07', 'RW', N'Gisagara', N'gisagara',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-04-DIST-08')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-04', CountryCode = 'RW', Name = N'Nyaruguru',
           NormalizedName = N'nyaruguru', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-04-DIST-08';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-04-DIST-08', N'RW-PROV-04', 'RW', N'Nyaruguru', N'nyaruguru',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-04-DIST-08-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-04-DIST-08', CountryCode = 'RW', Name = N'Nyaruguru',
           NormalizedName = N'nyaruguru', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-04-DIST-08-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-04-DIST-08-CITY-01', N'RW-PROV-04-DIST-08', 'RW', N'Nyaruguru', N'nyaruguru',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW', CountryCode = 'RW', Name = N'Western Province',
           NormalizedName = N'western province', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-05', N'RW', 'RW', N'Western Province', N'western province',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-05-DIST-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-05', CountryCode = 'RW', Name = N'Nyamasheke',
           NormalizedName = N'nyamasheke', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-05-DIST-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-05-DIST-01', N'RW-PROV-05', 'RW', N'Nyamasheke', N'nyamasheke',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-05-DIST-01-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-05-DIST-01', CountryCode = 'RW', Name = N'Nyamasheke',
           NormalizedName = N'nyamasheke', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-05-DIST-01-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-05-DIST-01-CITY-01', N'RW-PROV-05-DIST-01', 'RW', N'Nyamasheke', N'nyamasheke',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-05-DIST-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-05', CountryCode = 'RW', Name = N'Rusizi',
           NormalizedName = N'rusizi', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-05-DIST-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-05-DIST-02', N'RW-PROV-05', 'RW', N'Rusizi', N'rusizi',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-05-DIST-02-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-05-DIST-02', CountryCode = 'RW', Name = N'Rusizi / Cyangugu',
           NormalizedName = N'rusizi / cyangugu', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-05-DIST-02-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-05-DIST-02-CITY-01', N'RW-PROV-05-DIST-02', 'RW', N'Rusizi / Cyangugu', N'rusizi / cyangugu',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-05-DIST-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-05', CountryCode = 'RW', Name = N'Karongi',
           NormalizedName = N'karongi', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-05-DIST-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-05-DIST-03', N'RW-PROV-05', 'RW', N'Karongi', N'karongi',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-05-DIST-03-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-05-DIST-03', CountryCode = 'RW', Name = N'Karongi / Kibuye',
           NormalizedName = N'karongi / kibuye', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-05-DIST-03-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-05-DIST-03-CITY-01', N'RW-PROV-05-DIST-03', 'RW', N'Karongi / Kibuye', N'karongi / kibuye',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-05-DIST-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-05', CountryCode = 'RW', Name = N'Ngororero',
           NormalizedName = N'ngororero', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-05-DIST-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-05-DIST-04', N'RW-PROV-05', 'RW', N'Ngororero', N'ngororero',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-05-DIST-04-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-05-DIST-04', CountryCode = 'RW', Name = N'Ngororero',
           NormalizedName = N'ngororero', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-05-DIST-04-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-05-DIST-04-CITY-01', N'RW-PROV-05-DIST-04', 'RW', N'Ngororero', N'ngororero',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-05-DIST-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-05', CountryCode = 'RW', Name = N'Rutsiro',
           NormalizedName = N'rutsiro', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-05-DIST-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-05-DIST-05', N'RW-PROV-05', 'RW', N'Rutsiro', N'rutsiro',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-05-DIST-05-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-05-DIST-05', CountryCode = 'RW', Name = N'Rutsiro',
           NormalizedName = N'rutsiro', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-05-DIST-05-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-05-DIST-05-CITY-01', N'RW-PROV-05-DIST-05', 'RW', N'Rutsiro', N'rutsiro',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-05-DIST-06')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-05', CountryCode = 'RW', Name = N'Rubavu',
           NormalizedName = N'rubavu', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-05-DIST-06';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-05-DIST-06', N'RW-PROV-05', 'RW', N'Rubavu', N'rubavu',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-05-DIST-06-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-05-DIST-06', CountryCode = 'RW', Name = N'Rubavu / Gisenyi',
           NormalizedName = N'rubavu / gisenyi', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-05-DIST-06-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-05-DIST-06-CITY-01', N'RW-PROV-05-DIST-06', 'RW', N'Rubavu / Gisenyi', N'rubavu / gisenyi',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-05-DIST-07')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-05', CountryCode = 'RW', Name = N'Nyabihu',
           NormalizedName = N'nyabihu', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-05-DIST-07';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-05-DIST-07', N'RW-PROV-05', 'RW', N'Nyabihu', N'nyabihu',
            'ADMIN2', 2, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-PROV-05-DIST-07-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-05-DIST-07', CountryCode = 'RW', Name = N'Nyabihu',
           NormalizedName = N'nyabihu', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-PROV-05-DIST-07-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-PROV-05-DIST-07-CITY-01', N'RW-PROV-05-DIST-07', 'RW', N'Nyabihu', N'nyabihu',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-KGL-NBH-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-01-DIST-01-CITY-01', CountryCode = 'RW', Name = N'Kiyovu',
           NormalizedName = N'kiyovu', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-KGL-NBH-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-KGL-NBH-01', N'RW-PROV-01-DIST-01-CITY-01', 'RW', N'Kiyovu', N'kiyovu',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-KGL-NBH-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-01-DIST-01-CITY-01', CountryCode = 'RW', Name = N'Nyarutarama',
           NormalizedName = N'nyarutarama', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-KGL-NBH-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-KGL-NBH-02', N'RW-PROV-01-DIST-01-CITY-01', 'RW', N'Nyarutarama', N'nyarutarama',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-KGL-NBH-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-01-DIST-01-CITY-01', CountryCode = 'RW', Name = N'Kimihurura',
           NormalizedName = N'kimihurura', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-KGL-NBH-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-KGL-NBH-03', N'RW-PROV-01-DIST-01-CITY-01', 'RW', N'Kimihurura', N'kimihurura',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-KGL-NBH-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-01-DIST-01-CITY-01', CountryCode = 'RW', Name = N'Remera',
           NormalizedName = N'remera', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-KGL-NBH-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-KGL-NBH-04', N'RW-PROV-01-DIST-01-CITY-01', 'RW', N'Remera', N'remera',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-KGL-NBH-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-01-DIST-01-CITY-01', CountryCode = 'RW', Name = N'Kacyiru',
           NormalizedName = N'kacyiru', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-KGL-NBH-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-KGL-NBH-05', N'RW-PROV-01-DIST-01-CITY-01', 'RW', N'Kacyiru', N'kacyiru',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-KGL-NBH-06')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-01-DIST-01-CITY-01', CountryCode = 'RW', Name = N'Kimironko',
           NormalizedName = N'kimironko', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-KGL-NBH-06';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-KGL-NBH-06', N'RW-PROV-01-DIST-01-CITY-01', 'RW', N'Kimironko', N'kimironko',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-KGL-NBH-07')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-01-DIST-01-CITY-01', CountryCode = 'RW', Name = N'Gisozi',
           NormalizedName = N'gisozi', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-KGL-NBH-07';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-KGL-NBH-07', N'RW-PROV-01-DIST-01-CITY-01', 'RW', N'Gisozi', N'gisozi',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-KGL-NBH-08')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-01-DIST-01-CITY-01', CountryCode = 'RW', Name = N'Nyamirambo',
           NormalizedName = N'nyamirambo', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-KGL-NBH-08';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-KGL-NBH-08', N'RW-PROV-01-DIST-01-CITY-01', 'RW', N'Nyamirambo', N'nyamirambo',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-KGL-NBH-09')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-01-DIST-01-CITY-01', CountryCode = 'RW', Name = N'Gikondo',
           NormalizedName = N'gikondo', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-KGL-NBH-09';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-KGL-NBH-09', N'RW-PROV-01-DIST-01-CITY-01', 'RW', N'Gikondo', N'gikondo',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-KGL-NBH-10')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-01-DIST-01-CITY-01', CountryCode = 'RW', Name = N'Kicukiro Centre',
           NormalizedName = N'kicukiro centre', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-KGL-NBH-10';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-KGL-NBH-10', N'RW-PROV-01-DIST-01-CITY-01', 'RW', N'Kicukiro Centre', N'kicukiro centre',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-KGL-NBH-11')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-01-DIST-01-CITY-01', CountryCode = 'RW', Name = N'Kanombe',
           NormalizedName = N'kanombe', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-KGL-NBH-11';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-KGL-NBH-11', N'RW-PROV-01-DIST-01-CITY-01', 'RW', N'Kanombe', N'kanombe',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-KGL-NBH-12')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-01-DIST-01-CITY-01', CountryCode = 'RW', Name = N'Kibagabaga',
           NormalizedName = N'kibagabaga', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-KGL-NBH-12';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-KGL-NBH-12', N'RW-PROV-01-DIST-01-CITY-01', 'RW', N'Kibagabaga', N'kibagabaga',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-KGL-NBH-13')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-01-DIST-01-CITY-01', CountryCode = 'RW', Name = N'Gacuriro',
           NormalizedName = N'gacuriro', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-KGL-NBH-13';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-KGL-NBH-13', N'RW-PROV-01-DIST-01-CITY-01', 'RW', N'Gacuriro', N'gacuriro',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-KGL-NBH-14')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-01-DIST-01-CITY-01', CountryCode = 'RW', Name = N'Kagarama',
           NormalizedName = N'kagarama', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-KGL-NBH-14';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-KGL-NBH-14', N'RW-PROV-01-DIST-01-CITY-01', 'RW', N'Kagarama', N'kagarama',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'RW-KGL-NBH-15')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'RW-PROV-01-DIST-01-CITY-01', CountryCode = 'RW', Name = N'Kibagabaga',
           NormalizedName = N'kibagabaga', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'RW-KGL-NBH-15';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'RW-KGL-NBH-15', N'RW-PROV-01-DIST-01-CITY-01', 'RW', N'Kibagabaga', N'kibagabaga',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI', CountryCode = 'BI', Name = N'Buhumuza',
           NormalizedName = N'buhumuza', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-01', N'BI', 'BI', N'Buhumuza', N'buhumuza',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-01-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-01', CountryCode = 'BI', Name = N'Cankuzo',
           NormalizedName = N'cankuzo', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-01-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-01-CITY-01', N'BI-PROV-01', 'BI', N'Cankuzo', N'cankuzo',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-01-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-01', CountryCode = 'BI', Name = N'Muyinga',
           NormalizedName = N'muyinga', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-01-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-01-CITY-02', N'BI-PROV-01', 'BI', N'Muyinga', N'muyinga',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-01-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-01', CountryCode = 'BI', Name = N'Ruyigi',
           NormalizedName = N'ruyigi', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-01-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-01-CITY-03', N'BI-PROV-01', 'BI', N'Ruyigi', N'ruyigi',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI', CountryCode = 'BI', Name = N'Bujumbura',
           NormalizedName = N'bujumbura', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-02', N'BI', 'BI', N'Bujumbura', N'bujumbura',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-02-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-02', CountryCode = 'BI', Name = N'Bujumbura',
           NormalizedName = N'bujumbura', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-02-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-02-CITY-01', N'BI-PROV-02', 'BI', N'Bujumbura', N'bujumbura',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-02-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-02', CountryCode = 'BI', Name = N'Bubanza',
           NormalizedName = N'bubanza', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-02-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-02-CITY-02', N'BI-PROV-02', 'BI', N'Bubanza', N'bubanza',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-02-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-02', CountryCode = 'BI', Name = N'Cibitoke',
           NormalizedName = N'cibitoke', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-02-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-02-CITY-03', N'BI-PROV-02', 'BI', N'Cibitoke', N'cibitoke',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-02-CITY-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-02', CountryCode = 'BI', Name = N'Isare',
           NormalizedName = N'isare', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-02-CITY-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-02-CITY-04', N'BI-PROV-02', 'BI', N'Isare', N'isare',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-02-CITY-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-02', CountryCode = 'BI', Name = N'Mpanda',
           NormalizedName = N'mpanda', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-02-CITY-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-02-CITY-05', N'BI-PROV-02', 'BI', N'Mpanda', N'mpanda',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI', CountryCode = 'BI', Name = N'Burunga',
           NormalizedName = N'burunga', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-03', N'BI', 'BI', N'Burunga', N'burunga',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-03-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-03', CountryCode = 'BI', Name = N'Makamba',
           NormalizedName = N'makamba', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-03-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-03-CITY-01', N'BI-PROV-03', 'BI', N'Makamba', N'makamba',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-03-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-03', CountryCode = 'BI', Name = N'Bururi',
           NormalizedName = N'bururi', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-03-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-03-CITY-02', N'BI-PROV-03', 'BI', N'Bururi', N'bururi',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-03-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-03', CountryCode = 'BI', Name = N'Rutana',
           NormalizedName = N'rutana', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-03-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-03-CITY-03', N'BI-PROV-03', 'BI', N'Rutana', N'rutana',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-03-CITY-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-03', CountryCode = 'BI', Name = N'Rumonge',
           NormalizedName = N'rumonge', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-03-CITY-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-03-CITY-04', N'BI-PROV-03', 'BI', N'Rumonge', N'rumonge',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI', CountryCode = 'BI', Name = N'Butanyerera',
           NormalizedName = N'butanyerera', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-04', N'BI', 'BI', N'Butanyerera', N'butanyerera',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-04-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-04', CountryCode = 'BI', Name = N'Ngozi',
           NormalizedName = N'ngozi', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-04-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-04-CITY-01', N'BI-PROV-04', 'BI', N'Ngozi', N'ngozi',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-04-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-04', CountryCode = 'BI', Name = N'Kayanza',
           NormalizedName = N'kayanza', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-04-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-04-CITY-02', N'BI-PROV-04', 'BI', N'Kayanza', N'kayanza',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-04-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-04', CountryCode = 'BI', Name = N'Kirundo',
           NormalizedName = N'kirundo', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-04-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-04-CITY-03', N'BI-PROV-04', 'BI', N'Kirundo', N'kirundo',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI', CountryCode = 'BI', Name = N'Gitega',
           NormalizedName = N'gitega', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-05', N'BI', 'BI', N'Gitega', N'gitega',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-05-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-05', CountryCode = 'BI', Name = N'Gitega',
           NormalizedName = N'gitega', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-05-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-05-CITY-01', N'BI-PROV-05', 'BI', N'Gitega', N'gitega',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-05-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-05', CountryCode = 'BI', Name = N'Karusi',
           NormalizedName = N'karusi', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-05-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-05-CITY-02', N'BI-PROV-05', 'BI', N'Karusi', N'karusi',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-05-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-05', CountryCode = 'BI', Name = N'Mwaro',
           NormalizedName = N'mwaro', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-05-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-05-CITY-03', N'BI-PROV-05', 'BI', N'Mwaro', N'mwaro',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-PROV-05-CITY-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-05', CountryCode = 'BI', Name = N'Muramvya',
           NormalizedName = N'muramvya', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-PROV-05-CITY-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-PROV-05-CITY-04', N'BI-PROV-05', 'BI', N'Muramvya', N'muramvya',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-BJM-NBH-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-02-CITY-01', CountryCode = 'BI', Name = N'Rohero',
           NormalizedName = N'rohero', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-BJM-NBH-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-BJM-NBH-01', N'BI-PROV-02-CITY-01', 'BI', N'Rohero', N'rohero',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-BJM-NBH-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-02-CITY-01', CountryCode = 'BI', Name = N'Buyenzi',
           NormalizedName = N'buyenzi', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-BJM-NBH-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-BJM-NBH-02', N'BI-PROV-02-CITY-01', 'BI', N'Buyenzi', N'buyenzi',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-BJM-NBH-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-02-CITY-01', CountryCode = 'BI', Name = N'Bwiza',
           NormalizedName = N'bwiza', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-BJM-NBH-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-BJM-NBH-03', N'BI-PROV-02-CITY-01', 'BI', N'Bwiza', N'bwiza',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-BJM-NBH-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-02-CITY-01', CountryCode = 'BI', Name = N'Ngagara',
           NormalizedName = N'ngagara', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-BJM-NBH-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-BJM-NBH-04', N'BI-PROV-02-CITY-01', 'BI', N'Ngagara', N'ngagara',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-BJM-NBH-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-02-CITY-01', CountryCode = 'BI', Name = N'Kinama',
           NormalizedName = N'kinama', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-BJM-NBH-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-BJM-NBH-05', N'BI-PROV-02-CITY-01', 'BI', N'Kinama', N'kinama',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-BJM-NBH-06')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-02-CITY-01', CountryCode = 'BI', Name = N'Kamenge',
           NormalizedName = N'kamenge', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-BJM-NBH-06';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-BJM-NBH-06', N'BI-PROV-02-CITY-01', 'BI', N'Kamenge', N'kamenge',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-BJM-NBH-07')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-02-CITY-01', CountryCode = 'BI', Name = N'Cibitoke',
           NormalizedName = N'cibitoke', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-BJM-NBH-07';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-BJM-NBH-07', N'BI-PROV-02-CITY-01', 'BI', N'Cibitoke', N'cibitoke',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-BJM-NBH-08')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-02-CITY-01', CountryCode = 'BI', Name = N'Musaga',
           NormalizedName = N'musaga', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-BJM-NBH-08';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-BJM-NBH-08', N'BI-PROV-02-CITY-01', 'BI', N'Musaga', N'musaga',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-BJM-NBH-09')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-02-CITY-01', CountryCode = 'BI', Name = N'Kanyosha',
           NormalizedName = N'kanyosha', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-BJM-NBH-09';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-BJM-NBH-09', N'BI-PROV-02-CITY-01', 'BI', N'Kanyosha', N'kanyosha',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-BJM-NBH-10')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-02-CITY-01', CountryCode = 'BI', Name = N'Gihosha',
           NormalizedName = N'gihosha', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-BJM-NBH-10';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-BJM-NBH-10', N'BI-PROV-02-CITY-01', 'BI', N'Gihosha', N'gihosha',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-BJM-NBH-11')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-02-CITY-01', CountryCode = 'BI', Name = N'Nyakabiga',
           NormalizedName = N'nyakabiga', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-BJM-NBH-11';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-BJM-NBH-11', N'BI-PROV-02-CITY-01', 'BI', N'Nyakabiga', N'nyakabiga',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-BJM-NBH-12')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-02-CITY-01', CountryCode = 'BI', Name = N'Mutanga',
           NormalizedName = N'mutanga', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-BJM-NBH-12';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-BJM-NBH-12', N'BI-PROV-02-CITY-01', 'BI', N'Mutanga', N'mutanga',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'BI-BJM-NBH-13')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'BI-PROV-02-CITY-01', CountryCode = 'BI', Name = N'Gatumba',
           NormalizedName = N'gatumba', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'BI-BJM-NBH-13';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'BI-BJM-NBH-13', N'BI-PROV-02-CITY-01', 'BI', N'Gatumba', N'gatumba',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Kinshasa',
           NormalizedName = N'kinshasa', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-01', N'CD', 'CD', N'Kinshasa', N'kinshasa',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-01-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01', CountryCode = 'CD', Name = N'Kinshasa',
           NormalizedName = N'kinshasa', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-01-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-01-CITY-01', N'CD-PROV-01', 'CD', N'Kinshasa', N'kinshasa',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Kongo Central',
           NormalizedName = N'kongo central', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-02', N'CD', 'CD', N'Kongo Central', N'kongo central',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-02-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-02', CountryCode = 'CD', Name = N'Matadi',
           NormalizedName = N'matadi', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-02-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-02-CITY-01', N'CD-PROV-02', 'CD', N'Matadi', N'matadi',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Kwango',
           NormalizedName = N'kwango', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-03', N'CD', 'CD', N'Kwango', N'kwango',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-03-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-03', CountryCode = 'CD', Name = N'Kenge',
           NormalizedName = N'kenge', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-03-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-03-CITY-01', N'CD-PROV-03', 'CD', N'Kenge', N'kenge',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Kwilu',
           NormalizedName = N'kwilu', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-04', N'CD', 'CD', N'Kwilu', N'kwilu',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-04-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-04', CountryCode = 'CD', Name = N'Bandundu',
           NormalizedName = N'bandundu', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-04-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-04-CITY-01', N'CD-PROV-04', 'CD', N'Bandundu', N'bandundu',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Mai-Ndombe',
           NormalizedName = N'mai-ndombe', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-05', N'CD', 'CD', N'Mai-Ndombe', N'mai-ndombe',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-05-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-05', CountryCode = 'CD', Name = N'Inongo',
           NormalizedName = N'inongo', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-05-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-05-CITY-01', N'CD-PROV-05', 'CD', N'Inongo', N'inongo',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-06')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Kasai',
           NormalizedName = N'kasai', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-06';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-06', N'CD', 'CD', N'Kasai', N'kasai',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-06-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-06', CountryCode = 'CD', Name = N'Tshikapa',
           NormalizedName = N'tshikapa', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-06-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-06-CITY-01', N'CD-PROV-06', 'CD', N'Tshikapa', N'tshikapa',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-07')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Kasai-Central',
           NormalizedName = N'kasai-central', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-07';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-07', N'CD', 'CD', N'Kasai-Central', N'kasai-central',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-07-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-07', CountryCode = 'CD', Name = N'Kananga',
           NormalizedName = N'kananga', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-07-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-07-CITY-01', N'CD-PROV-07', 'CD', N'Kananga', N'kananga',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-08')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Kasai-Oriental',
           NormalizedName = N'kasai-oriental', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-08';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-08', N'CD', 'CD', N'Kasai-Oriental', N'kasai-oriental',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-08-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-08', CountryCode = 'CD', Name = N'Mbuji-Mayi',
           NormalizedName = N'mbuji-mayi', LocationType = 'CITY',
           AdminLevel = 3, Aliases = N'Mbuji Mayi', Notes = NULL
     WHERE LocationCode = N'CD-PROV-08-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-08-CITY-01', N'CD-PROV-08', 'CD', N'Mbuji-Mayi', N'mbuji-mayi',
            'CITY', 3, N'Mbuji Mayi', NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-09')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Lomami',
           NormalizedName = N'lomami', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-09';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-09', N'CD', 'CD', N'Lomami', N'lomami',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-09-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-09', CountryCode = 'CD', Name = N'Kabinda',
           NormalizedName = N'kabinda', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-09-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-09-CITY-01', N'CD-PROV-09', 'CD', N'Kabinda', N'kabinda',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-10')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Sankuru',
           NormalizedName = N'sankuru', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-10';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-10', N'CD', 'CD', N'Sankuru', N'sankuru',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-10-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-10', CountryCode = 'CD', Name = N'Lusambo',
           NormalizedName = N'lusambo', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-10-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-10-CITY-01', N'CD-PROV-10', 'CD', N'Lusambo', N'lusambo',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-11')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Bas-Uele',
           NormalizedName = N'bas-uele', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-11';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-11', N'CD', 'CD', N'Bas-Uele', N'bas-uele',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-11-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-11', CountryCode = 'CD', Name = N'Buta',
           NormalizedName = N'buta', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-11-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-11-CITY-01', N'CD-PROV-11', 'CD', N'Buta', N'buta',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-12')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Haut-Uele',
           NormalizedName = N'haut-uele', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-12';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-12', N'CD', 'CD', N'Haut-Uele', N'haut-uele',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-12-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-12', CountryCode = 'CD', Name = N'Isiro',
           NormalizedName = N'isiro', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-12-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-12-CITY-01', N'CD-PROV-12', 'CD', N'Isiro', N'isiro',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-13')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Ituri',
           NormalizedName = N'ituri', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-13';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-13', N'CD', 'CD', N'Ituri', N'ituri',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-13-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-13', CountryCode = 'CD', Name = N'Bunia',
           NormalizedName = N'bunia', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-13-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-13-CITY-01', N'CD-PROV-13', 'CD', N'Bunia', N'bunia',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-14')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Maniema',
           NormalizedName = N'maniema', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-14';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-14', N'CD', 'CD', N'Maniema', N'maniema',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-14-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-14', CountryCode = 'CD', Name = N'Kindu',
           NormalizedName = N'kindu', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-14-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-14-CITY-01', N'CD-PROV-14', 'CD', N'Kindu', N'kindu',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-15')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Nord-Kivu',
           NormalizedName = N'nord-kivu', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = N'North Kivu', Notes = NULL
     WHERE LocationCode = N'CD-PROV-15';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-15', N'CD', 'CD', N'Nord-Kivu', N'nord-kivu',
            'ADMIN1', 1, N'North Kivu', NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-15-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-15', CountryCode = 'CD', Name = N'Goma',
           NormalizedName = N'goma', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-15-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-15-CITY-01', N'CD-PROV-15', 'CD', N'Goma', N'goma',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-16')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Sud-Kivu',
           NormalizedName = N'sud-kivu', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = N'South Kivu', Notes = NULL
     WHERE LocationCode = N'CD-PROV-16';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-16', N'CD', 'CD', N'Sud-Kivu', N'sud-kivu',
            'ADMIN1', 1, N'South Kivu', NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-16-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-16', CountryCode = 'CD', Name = N'Bukavu',
           NormalizedName = N'bukavu', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-16-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-16-CITY-01', N'CD-PROV-16', 'CD', N'Bukavu', N'bukavu',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-17')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Tshopo',
           NormalizedName = N'tshopo', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-17';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-17', N'CD', 'CD', N'Tshopo', N'tshopo',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-17-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-17', CountryCode = 'CD', Name = N'Kisangani',
           NormalizedName = N'kisangani', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-17-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-17-CITY-01', N'CD-PROV-17', 'CD', N'Kisangani', N'kisangani',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-18')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Équateur',
           NormalizedName = N'équateur', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = N'Equateur', Notes = NULL
     WHERE LocationCode = N'CD-PROV-18';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-18', N'CD', 'CD', N'Équateur', N'équateur',
            'ADMIN1', 1, N'Equateur', NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-18-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-18', CountryCode = 'CD', Name = N'Mbandaka',
           NormalizedName = N'mbandaka', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-18-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-18-CITY-01', N'CD-PROV-18', 'CD', N'Mbandaka', N'mbandaka',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-19')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Mongala',
           NormalizedName = N'mongala', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-19';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-19', N'CD', 'CD', N'Mongala', N'mongala',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-19-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-19', CountryCode = 'CD', Name = N'Lisala',
           NormalizedName = N'lisala', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-19-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-19-CITY-01', N'CD-PROV-19', 'CD', N'Lisala', N'lisala',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-20')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Nord-Ubangi',
           NormalizedName = N'nord-ubangi', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-20';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-20', N'CD', 'CD', N'Nord-Ubangi', N'nord-ubangi',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-20-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-20', CountryCode = 'CD', Name = N'Gbadolite',
           NormalizedName = N'gbadolite', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-20-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-20-CITY-01', N'CD-PROV-20', 'CD', N'Gbadolite', N'gbadolite',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-21')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Sud-Ubangi',
           NormalizedName = N'sud-ubangi', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-21';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-21', N'CD', 'CD', N'Sud-Ubangi', N'sud-ubangi',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-21-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-21', CountryCode = 'CD', Name = N'Gemena',
           NormalizedName = N'gemena', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-21-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-21-CITY-01', N'CD-PROV-21', 'CD', N'Gemena', N'gemena',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-22')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Tshuapa',
           NormalizedName = N'tshuapa', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-22';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-22', N'CD', 'CD', N'Tshuapa', N'tshuapa',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-22-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-22', CountryCode = 'CD', Name = N'Boende',
           NormalizedName = N'boende', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-22-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-22-CITY-01', N'CD-PROV-22', 'CD', N'Boende', N'boende',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-23')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Haut-Katanga',
           NormalizedName = N'haut-katanga', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-23';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-23', N'CD', 'CD', N'Haut-Katanga', N'haut-katanga',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-23-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-23', CountryCode = 'CD', Name = N'Lubumbashi',
           NormalizedName = N'lubumbashi', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-23-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-23-CITY-01', N'CD-PROV-23', 'CD', N'Lubumbashi', N'lubumbashi',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-24')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Haut-Lomami',
           NormalizedName = N'haut-lomami', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-24';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-24', N'CD', 'CD', N'Haut-Lomami', N'haut-lomami',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-24-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-24', CountryCode = 'CD', Name = N'Kamina',
           NormalizedName = N'kamina', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-24-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-24-CITY-01', N'CD-PROV-24', 'CD', N'Kamina', N'kamina',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-25')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Lualaba',
           NormalizedName = N'lualaba', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-25';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-25', N'CD', 'CD', N'Lualaba', N'lualaba',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-25-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-25', CountryCode = 'CD', Name = N'Kolwezi',
           NormalizedName = N'kolwezi', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-25-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-25-CITY-01', N'CD-PROV-25', 'CD', N'Kolwezi', N'kolwezi',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-26')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD', CountryCode = 'CD', Name = N'Tanganyika',
           NormalizedName = N'tanganyika', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-26';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-26', N'CD', 'CD', N'Tanganyika', N'tanganyika',
            'ADMIN1', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-26-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-26', CountryCode = 'CD', Name = N'Kalemie',
           NormalizedName = N'kalemie', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-26-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-26-CITY-01', N'CD-PROV-26', 'CD', N'Kalemie', N'kalemie',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-01-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01', CountryCode = 'CD', Name = N'Kikwit',
           NormalizedName = N'kikwit', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-01-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-01-CITY-02', N'CD-PROV-01', 'CD', N'Kikwit', N'kikwit',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-23-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-23', CountryCode = 'CD', Name = N'Likasi',
           NormalizedName = N'likasi', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-23-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-23-CITY-02', N'CD-PROV-23', 'CD', N'Likasi', N'likasi',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-23-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-23', CountryCode = 'CD', Name = N'Kasumbalesa',
           NormalizedName = N'kasumbalesa', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-23-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-23-CITY-03', N'CD-PROV-23', 'CD', N'Kasumbalesa', N'kasumbalesa',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-25-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-25', CountryCode = 'CD', Name = N'Dilolo',
           NormalizedName = N'dilolo', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-25-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-25-CITY-02', N'CD-PROV-25', 'CD', N'Dilolo', N'dilolo',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-15-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-15', CountryCode = 'CD', Name = N'Beni',
           NormalizedName = N'beni', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-15-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-15-CITY-02', N'CD-PROV-15', 'CD', N'Beni', N'beni',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-15-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-15', CountryCode = 'CD', Name = N'Butembo',
           NormalizedName = N'butembo', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-15-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-15-CITY-03', N'CD-PROV-15', 'CD', N'Butembo', N'butembo',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-16-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-16', CountryCode = 'CD', Name = N'Uvira',
           NormalizedName = N'uvira', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-16-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-16-CITY-02', N'CD-PROV-16', 'CD', N'Uvira', N'uvira',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-16-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-16', CountryCode = 'CD', Name = N'Baraka',
           NormalizedName = N'baraka', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-16-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-16-CITY-03', N'CD-PROV-16', 'CD', N'Baraka', N'baraka',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-02-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-02', CountryCode = 'CD', Name = N'Boma',
           NormalizedName = N'boma', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-02-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-02-CITY-02', N'CD-PROV-02', 'CD', N'Boma', N'boma',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-17-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-17', CountryCode = 'CD', Name = N'Isangi',
           NormalizedName = N'isangi', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-17-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-17-CITY-02', N'CD-PROV-17', 'CD', N'Isangi', N'isangi',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-04-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-04', CountryCode = 'CD', Name = N'Kikwit',
           NormalizedName = N'kikwit', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-04-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-04-CITY-02', N'CD-PROV-04', 'CD', N'Kikwit', N'kikwit',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-18-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-18', CountryCode = 'CD', Name = N'Bikoro',
           NormalizedName = N'bikoro', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-18-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-18-CITY-02', N'CD-PROV-18', 'CD', N'Bikoro', N'bikoro',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-PROV-05-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-05', CountryCode = 'CD', Name = N'Kutu',
           NormalizedName = N'kutu', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'CD-PROV-05-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-PROV-05-CITY-02', N'CD-PROV-05', 'CD', N'Kutu', N'kutu',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Gombe',
           NormalizedName = N'gombe', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-01', N'CD-PROV-01-CITY-01', 'CD', N'Gombe', N'gombe',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Kintambo',
           NormalizedName = N'kintambo', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-02', N'CD-PROV-01-CITY-01', 'CD', N'Kintambo', N'kintambo',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Ngaliema',
           NormalizedName = N'ngaliema', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-03', N'CD-PROV-01-CITY-01', 'CD', N'Ngaliema', N'ngaliema',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Limete',
           NormalizedName = N'limete', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-04', N'CD-PROV-01-CITY-01', 'CD', N'Limete', N'limete',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Lemba',
           NormalizedName = N'lemba', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-05', N'CD-PROV-01-CITY-01', 'CD', N'Lemba', N'lemba',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-06')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Matete',
           NormalizedName = N'matete', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-06';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-06', N'CD-PROV-01-CITY-01', 'CD', N'Matete', N'matete',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-07')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Kalamu',
           NormalizedName = N'kalamu', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-07';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-07', N'CD-PROV-01-CITY-01', 'CD', N'Kalamu', N'kalamu',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-08')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Barumbu',
           NormalizedName = N'barumbu', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-08';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-08', N'CD-PROV-01-CITY-01', 'CD', N'Barumbu', N'barumbu',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-09')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Lingwala',
           NormalizedName = N'lingwala', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-09';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-09', N'CD-PROV-01-CITY-01', 'CD', N'Lingwala', N'lingwala',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-10')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Kinshasa',
           NormalizedName = N'kinshasa', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-10';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-10', N'CD-PROV-01-CITY-01', 'CD', N'Kinshasa', N'kinshasa',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-11')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Bandalungwa',
           NormalizedName = N'bandalungwa', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-11';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-11', N'CD-PROV-01-CITY-01', 'CD', N'Bandalungwa', N'bandalungwa',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-12')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Ngiri-Ngiri',
           NormalizedName = N'ngiri-ngiri', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-12';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-12', N'CD-PROV-01-CITY-01', 'CD', N'Ngiri-Ngiri', N'ngiri-ngiri',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-13')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Kasa-Vubu',
           NormalizedName = N'kasa-vubu', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-13';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-13', N'CD-PROV-01-CITY-01', 'CD', N'Kasa-Vubu', N'kasa-vubu',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-14')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Makala',
           NormalizedName = N'makala', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-14';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-14', N'CD-PROV-01-CITY-01', 'CD', N'Makala', N'makala',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-15')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Bumbu',
           NormalizedName = N'bumbu', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-15';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-15', N'CD-PROV-01-CITY-01', 'CD', N'Bumbu', N'bumbu',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-16')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Selembao',
           NormalizedName = N'selembao', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-16';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-16', N'CD-PROV-01-CITY-01', 'CD', N'Selembao', N'selembao',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-17')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Mont-Ngafula',
           NormalizedName = N'mont-ngafula', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-17';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-17', N'CD-PROV-01-CITY-01', 'CD', N'Mont-Ngafula', N'mont-ngafula',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-18')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Masina',
           NormalizedName = N'masina', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-18';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-18', N'CD-PROV-01-CITY-01', 'CD', N'Masina', N'masina',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-19')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Ndjili',
           NormalizedName = N'ndjili', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-19';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-19', N'CD-PROV-01-CITY-01', 'CD', N'Ndjili', N'ndjili',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-20')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Kimbanseke',
           NormalizedName = N'kimbanseke', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-20';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-20', N'CD-PROV-01-CITY-01', 'CD', N'Kimbanseke', N'kimbanseke',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-21')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Nsele',
           NormalizedName = N'nsele', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-21';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-21', N'CD-PROV-01-CITY-01', 'CD', N'Nsele', N'nsele',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'CD-KIN-COM-22')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'CD-PROV-01-CITY-01', CountryCode = 'CD', Name = N'Maluku',
           NormalizedName = N'maluku', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = N'Commune of Kinshasa; classified as urban locality for onboarding'
     WHERE LocationCode = N'CD-KIN-COM-22';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'CD-KIN-COM-22', N'CD-PROV-01-CITY-01', 'CD', N'Maluku', N'maluku',
            'NEIGHBOURHOOD', 4, NULL, N'Commune of Kinshasa; classified as urban locality for onboarding');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS', CountryCode = 'SS', Name = N'Central Equatoria',
           NormalizedName = N'central equatoria', LocationType = 'STATE',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-01', N'SS', 'SS', N'Central Equatoria', N'central equatoria',
            'STATE', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-01-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-01', CountryCode = 'SS', Name = N'Juba',
           NormalizedName = N'juba', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-01-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-01-CITY-01', N'SS-UNIT-01', 'SS', N'Juba', N'juba',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-01-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-01', CountryCode = 'SS', Name = N'Yei',
           NormalizedName = N'yei', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-01-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-01-CITY-02', N'SS-UNIT-01', 'SS', N'Yei', N'yei',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-01-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-01', CountryCode = 'SS', Name = N'Kajo-Keji',
           NormalizedName = N'kajo-keji', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-01-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-01-CITY-03', N'SS-UNIT-01', 'SS', N'Kajo-Keji', N'kajo-keji',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-01-CITY-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-01', CountryCode = 'SS', Name = N'Terekeka',
           NormalizedName = N'terekeka', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-01-CITY-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-01-CITY-04', N'SS-UNIT-01', 'SS', N'Terekeka', N'terekeka',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-01-CITY-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-01', CountryCode = 'SS', Name = N'Torit',
           NormalizedName = N'torit', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-01-CITY-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-01-CITY-05', N'SS-UNIT-01', 'SS', N'Torit', N'torit',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS', CountryCode = 'SS', Name = N'Eastern Equatoria',
           NormalizedName = N'eastern equatoria', LocationType = 'STATE',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-02', N'SS', 'SS', N'Eastern Equatoria', N'eastern equatoria',
            'STATE', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-02-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-02', CountryCode = 'SS', Name = N'Torit',
           NormalizedName = N'torit', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-02-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-02-CITY-01', N'SS-UNIT-02', 'SS', N'Torit', N'torit',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-02-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-02', CountryCode = 'SS', Name = N'Kapoeta',
           NormalizedName = N'kapoeta', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-02-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-02-CITY-02', N'SS-UNIT-02', 'SS', N'Kapoeta', N'kapoeta',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-02-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-02', CountryCode = 'SS', Name = N'Magwi',
           NormalizedName = N'magwi', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-02-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-02-CITY-03', N'SS-UNIT-02', 'SS', N'Magwi', N'magwi',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS', CountryCode = 'SS', Name = N'Western Equatoria',
           NormalizedName = N'western equatoria', LocationType = 'STATE',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-03', N'SS', 'SS', N'Western Equatoria', N'western equatoria',
            'STATE', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-03-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-03', CountryCode = 'SS', Name = N'Yambio',
           NormalizedName = N'yambio', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-03-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-03-CITY-01', N'SS-UNIT-03', 'SS', N'Yambio', N'yambio',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-03-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-03', CountryCode = 'SS', Name = N'Maridi',
           NormalizedName = N'maridi', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-03-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-03-CITY-02', N'SS-UNIT-03', 'SS', N'Maridi', N'maridi',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-03-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-03', CountryCode = 'SS', Name = N'Tambura',
           NormalizedName = N'tambura', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-03-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-03-CITY-03', N'SS-UNIT-03', 'SS', N'Tambura', N'tambura',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS', CountryCode = 'SS', Name = N'Jonglei',
           NormalizedName = N'jonglei', LocationType = 'STATE',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-04', N'SS', 'SS', N'Jonglei', N'jonglei',
            'STATE', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-04-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-04', CountryCode = 'SS', Name = N'Bor',
           NormalizedName = N'bor', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-04-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-04-CITY-01', N'SS-UNIT-04', 'SS', N'Bor', N'bor',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-04-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-04', CountryCode = 'SS', Name = N'Pibor',
           NormalizedName = N'pibor', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-04-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-04-CITY-02', N'SS-UNIT-04', 'SS', N'Pibor', N'pibor',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-04-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-04', CountryCode = 'SS', Name = N'Akobo',
           NormalizedName = N'akobo', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-04-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-04-CITY-03', N'SS-UNIT-04', 'SS', N'Akobo', N'akobo',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-04-CITY-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-04', CountryCode = 'SS', Name = N'Ayod',
           NormalizedName = N'ayod', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-04-CITY-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-04-CITY-04', N'SS-UNIT-04', 'SS', N'Ayod', N'ayod',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS', CountryCode = 'SS', Name = N'Unity',
           NormalizedName = N'unity', LocationType = 'STATE',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-05', N'SS', 'SS', N'Unity', N'unity',
            'STATE', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-05-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-05', CountryCode = 'SS', Name = N'Bentiu',
           NormalizedName = N'bentiu', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-05-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-05-CITY-01', N'SS-UNIT-05', 'SS', N'Bentiu', N'bentiu',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-05-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-05', CountryCode = 'SS', Name = N'Rubkona',
           NormalizedName = N'rubkona', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-05-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-05-CITY-02', N'SS-UNIT-05', 'SS', N'Rubkona', N'rubkona',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-05-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-05', CountryCode = 'SS', Name = N'Leer',
           NormalizedName = N'leer', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-05-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-05-CITY-03', N'SS-UNIT-05', 'SS', N'Leer', N'leer',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-05-CITY-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-05', CountryCode = 'SS', Name = N'Mayom',
           NormalizedName = N'mayom', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-05-CITY-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-05-CITY-04', N'SS-UNIT-05', 'SS', N'Mayom', N'mayom',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-06')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS', CountryCode = 'SS', Name = N'Upper Nile',
           NormalizedName = N'upper nile', LocationType = 'STATE',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-06';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-06', N'SS', 'SS', N'Upper Nile', N'upper nile',
            'STATE', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-06-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-06', CountryCode = 'SS', Name = N'Malakal',
           NormalizedName = N'malakal', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-06-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-06-CITY-01', N'SS-UNIT-06', 'SS', N'Malakal', N'malakal',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-06-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-06', CountryCode = 'SS', Name = N'Nasir',
           NormalizedName = N'nasir', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-06-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-06-CITY-02', N'SS-UNIT-06', 'SS', N'Nasir', N'nasir',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-06-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-06', CountryCode = 'SS', Name = N'Renk',
           NormalizedName = N'renk', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-06-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-06-CITY-03', N'SS-UNIT-06', 'SS', N'Renk', N'renk',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-06-CITY-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-06', CountryCode = 'SS', Name = N'Melut',
           NormalizedName = N'melut', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-06-CITY-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-06-CITY-04', N'SS-UNIT-06', 'SS', N'Melut', N'melut',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-07')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS', CountryCode = 'SS', Name = N'Lakes',
           NormalizedName = N'lakes', LocationType = 'STATE',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-07';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-07', N'SS', 'SS', N'Lakes', N'lakes',
            'STATE', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-07-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-07', CountryCode = 'SS', Name = N'Rumbek',
           NormalizedName = N'rumbek', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-07-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-07-CITY-01', N'SS-UNIT-07', 'SS', N'Rumbek', N'rumbek',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-07-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-07', CountryCode = 'SS', Name = N'Yirol',
           NormalizedName = N'yirol', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-07-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-07-CITY-02', N'SS-UNIT-07', 'SS', N'Yirol', N'yirol',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-07-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-07', CountryCode = 'SS', Name = N'Cueibet',
           NormalizedName = N'cueibet', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-07-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-07-CITY-03', N'SS-UNIT-07', 'SS', N'Cueibet', N'cueibet',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-08')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS', CountryCode = 'SS', Name = N'Warrap',
           NormalizedName = N'warrap', LocationType = 'STATE',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-08';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-08', N'SS', 'SS', N'Warrap', N'warrap',
            'STATE', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-08-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-08', CountryCode = 'SS', Name = N'Kuajok',
           NormalizedName = N'kuajok', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-08-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-08-CITY-01', N'SS-UNIT-08', 'SS', N'Kuajok', N'kuajok',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-08-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-08', CountryCode = 'SS', Name = N'Gogrial',
           NormalizedName = N'gogrial', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-08-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-08-CITY-02', N'SS-UNIT-08', 'SS', N'Gogrial', N'gogrial',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-08-CITY-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-08', CountryCode = 'SS', Name = N'Tonj',
           NormalizedName = N'tonj', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-08-CITY-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-08-CITY-03', N'SS-UNIT-08', 'SS', N'Tonj', N'tonj',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-09')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS', CountryCode = 'SS', Name = N'Northern Bahr el Ghazal',
           NormalizedName = N'northern bahr el ghazal', LocationType = 'STATE',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-09';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-09', N'SS', 'SS', N'Northern Bahr el Ghazal', N'northern bahr el ghazal',
            'STATE', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-09-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-09', CountryCode = 'SS', Name = N'Aweil',
           NormalizedName = N'aweil', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-09-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-09-CITY-01', N'SS-UNIT-09', 'SS', N'Aweil', N'aweil',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-09-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-09', CountryCode = 'SS', Name = N'Gok Machar',
           NormalizedName = N'gok machar', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-09-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-09-CITY-02', N'SS-UNIT-09', 'SS', N'Gok Machar', N'gok machar',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-10')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS', CountryCode = 'SS', Name = N'Western Bahr el Ghazal',
           NormalizedName = N'western bahr el ghazal', LocationType = 'STATE',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-10';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-10', N'SS', 'SS', N'Western Bahr el Ghazal', N'western bahr el ghazal',
            'STATE', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-10-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-10', CountryCode = 'SS', Name = N'Wau',
           NormalizedName = N'wau', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-10-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-10-CITY-01', N'SS-UNIT-10', 'SS', N'Wau', N'wau',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-10-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-10', CountryCode = 'SS', Name = N'Raja',
           NormalizedName = N'raja', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-10-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-10-CITY-02', N'SS-UNIT-10', 'SS', N'Raja', N'raja',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-11')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS', CountryCode = 'SS', Name = N'Abyei Administrative Area',
           NormalizedName = N'abyei administrative area', LocationType = 'ADMIN_AREA',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-11';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-11', N'SS', 'SS', N'Abyei Administrative Area', N'abyei administrative area',
            'ADMIN_AREA', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-11-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-11', CountryCode = 'SS', Name = N'Abyei',
           NormalizedName = N'abyei', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-11-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-11-CITY-01', N'SS-UNIT-11', 'SS', N'Abyei', N'abyei',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-12')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS', CountryCode = 'SS', Name = N'Greater Pibor Administrative Area',
           NormalizedName = N'greater pibor administrative area', LocationType = 'ADMIN_AREA',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-12';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-12', N'SS', 'SS', N'Greater Pibor Administrative Area', N'greater pibor administrative area',
            'ADMIN_AREA', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-12-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-12', CountryCode = 'SS', Name = N'Greater Pibor Administrative Area',
           NormalizedName = N'greater pibor administrative area', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-12-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-12-CITY-01', N'SS-UNIT-12', 'SS', N'Greater Pibor Administrative Area', N'greater pibor administrative area',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-13')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS', CountryCode = 'SS', Name = N'Ruweng Administrative Area',
           NormalizedName = N'ruweng administrative area', LocationType = 'ADMIN_AREA',
           AdminLevel = 1, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-13';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-13', N'SS', 'SS', N'Ruweng Administrative Area', N'ruweng administrative area',
            'ADMIN_AREA', 1, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-13-CITY-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-13', CountryCode = 'SS', Name = N'Panrieng',
           NormalizedName = N'panrieng', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-13-CITY-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-13-CITY-01', N'SS-UNIT-13', 'SS', N'Panrieng', N'panrieng',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-UNIT-13-CITY-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-13', CountryCode = 'SS', Name = N'Abiemnom',
           NormalizedName = N'abiemnom', LocationType = 'CITY',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-UNIT-13-CITY-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-UNIT-13-CITY-02', N'SS-UNIT-13', 'SS', N'Abiemnom', N'abiemnom',
            'CITY', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-JUB-NBH-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-01-CITY-01', CountryCode = 'SS', Name = N'Juba Town',
           NormalizedName = N'juba town', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-JUB-NBH-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-JUB-NBH-01', N'SS-UNIT-01-CITY-01', 'SS', N'Juba Town', N'juba town',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-JUB-NBH-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-01-CITY-01', CountryCode = 'SS', Name = N'Munuki',
           NormalizedName = N'munuki', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-JUB-NBH-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-JUB-NBH-02', N'SS-UNIT-01-CITY-01', 'SS', N'Munuki', N'munuki',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-JUB-NBH-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-01-CITY-01', CountryCode = 'SS', Name = N'Kator',
           NormalizedName = N'kator', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-JUB-NBH-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-JUB-NBH-03', N'SS-UNIT-01-CITY-01', 'SS', N'Kator', N'kator',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-JUB-NBH-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-01-CITY-01', CountryCode = 'SS', Name = N'Gudele',
           NormalizedName = N'gudele', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-JUB-NBH-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-JUB-NBH-04', N'SS-UNIT-01-CITY-01', 'SS', N'Gudele', N'gudele',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-JUB-NBH-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-01-CITY-01', CountryCode = 'SS', Name = N'Jebel',
           NormalizedName = N'jebel', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-JUB-NBH-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-JUB-NBH-05', N'SS-UNIT-01-CITY-01', 'SS', N'Jebel', N'jebel',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-JUB-NBH-06')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-01-CITY-01', CountryCode = 'SS', Name = N'Hai Malakal',
           NormalizedName = N'hai malakal', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-JUB-NBH-06';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-JUB-NBH-06', N'SS-UNIT-01-CITY-01', 'SS', N'Hai Malakal', N'hai malakal',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-JUB-NBH-07')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-01-CITY-01', CountryCode = 'SS', Name = N'Tongping',
           NormalizedName = N'tongping', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-JUB-NBH-07';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-JUB-NBH-07', N'SS-UNIT-01-CITY-01', 'SS', N'Tongping', N'tongping',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-JUB-NBH-08')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-01-CITY-01', CountryCode = 'SS', Name = N'Custom',
           NormalizedName = N'custom', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-JUB-NBH-08';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-JUB-NBH-08', N'SS-UNIT-01-CITY-01', 'SS', N'Custom', N'custom',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-JUB-NBH-09')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-01-CITY-01', CountryCode = 'SS', Name = N'Atlabara',
           NormalizedName = N'atlabara', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-JUB-NBH-09';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-JUB-NBH-09', N'SS-UNIT-01-CITY-01', 'SS', N'Atlabara', N'atlabara',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-JUB-NBH-10')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-01-CITY-01', CountryCode = 'SS', Name = N'Sherikat',
           NormalizedName = N'sherikat', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-JUB-NBH-10';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-JUB-NBH-10', N'SS-UNIT-01-CITY-01', 'SS', N'Sherikat', N'sherikat',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-JUB-NBH-11')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-01-CITY-01', CountryCode = 'SS', Name = N'Gumbo',
           NormalizedName = N'gumbo', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-JUB-NBH-11';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-JUB-NBH-11', N'SS-UNIT-01-CITY-01', 'SS', N'Gumbo', N'gumbo',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'SS-JUB-NBH-12')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'SS-UNIT-01-CITY-01', CountryCode = 'SS', Name = N'Rock City',
           NormalizedName = N'rock city', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'SS-JUB-NBH-12';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'SS-JUB-NBH-12', N'SS-UNIT-01-CITY-01', 'SS', N'Rock City', N'rock city',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG')
    UPDATE dbo.Locations
       SET ParentLocationCode = NULL, CountryCode = 'UG', Name = N'Uganda',
           NormalizedName = N'uganda', LocationType = 'COUNTRY',
           AdminLevel = 0, Aliases = N'Republic of Uganda|UG', Notes = NULL
     WHERE LocationCode = N'UG';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG', NULL, 'UG', N'Uganda', N'uganda',
            'COUNTRY', 0, N'Republic of Uganda|UG', NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-REG-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG', CountryCode = 'UG', Name = N'Central Region',
           NormalizedName = N'central region', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = N'Central', Notes = NULL
     WHERE LocationCode = N'UG-REG-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-REG-01', N'UG', 'UG', N'Central Region', N'central region',
            'ADMIN1', 1, N'Central', NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-REG-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG', CountryCode = 'UG', Name = N'Eastern Region',
           NormalizedName = N'eastern region', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = N'Eastern', Notes = NULL
     WHERE LocationCode = N'UG-REG-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-REG-02', N'UG', 'UG', N'Eastern Region', N'eastern region',
            'ADMIN1', 1, N'Eastern', NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-REG-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG', CountryCode = 'UG', Name = N'Northern Region',
           NormalizedName = N'northern region', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = N'Northern', Notes = NULL
     WHERE LocationCode = N'UG-REG-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-REG-03', N'UG', 'UG', N'Northern Region', N'northern region',
            'ADMIN1', 1, N'Northern', NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-REG-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG', CountryCode = 'UG', Name = N'Western Region',
           NormalizedName = N'western region', LocationType = 'ADMIN1',
           AdminLevel = 1, Aliases = N'Western', Notes = NULL
     WHERE LocationCode = N'UG-REG-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-REG-04', N'UG', 'UG', N'Western Region', N'western region',
            'ADMIN1', 1, N'Western', NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-001')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Buikwe',
           NormalizedName = N'buikwe', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-001';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-001', N'UG-REG-01', 'UG', N'Buikwe', N'buikwe',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-002')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Bukomansimbi',
           NormalizedName = N'bukomansimbi', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-002';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-002', N'UG-REG-01', 'UG', N'Bukomansimbi', N'bukomansimbi',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-003')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Butambala',
           NormalizedName = N'butambala', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-003';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-003', N'UG-REG-01', 'UG', N'Butambala', N'butambala',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-004')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Buvuma',
           NormalizedName = N'buvuma', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-004';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-004', N'UG-REG-01', 'UG', N'Buvuma', N'buvuma',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-005')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Gomba',
           NormalizedName = N'gomba', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-005';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-005', N'UG-REG-01', 'UG', N'Gomba', N'gomba',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-006')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Kalangala',
           NormalizedName = N'kalangala', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-006';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-006', N'UG-REG-01', 'UG', N'Kalangala', N'kalangala',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-007')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Kalungu',
           NormalizedName = N'kalungu', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-007';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-007', N'UG-REG-01', 'UG', N'Kalungu', N'kalungu',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-008')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Kayunga',
           NormalizedName = N'kayunga', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-008';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-008', N'UG-REG-01', 'UG', N'Kayunga', N'kayunga',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-009')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Kiboga',
           NormalizedName = N'kiboga', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-009';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-009', N'UG-REG-01', 'UG', N'Kiboga', N'kiboga',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-010')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Kyankwanzi',
           NormalizedName = N'kyankwanzi', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-010';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-010', N'UG-REG-01', 'UG', N'Kyankwanzi', N'kyankwanzi',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-011')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Luwero',
           NormalizedName = N'luwero', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-011';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-011', N'UG-REG-01', 'UG', N'Luwero', N'luwero',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-012')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Lwengo',
           NormalizedName = N'lwengo', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-012';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-012', N'UG-REG-01', 'UG', N'Lwengo', N'lwengo',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-013')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Lyantonde',
           NormalizedName = N'lyantonde', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-013';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-013', N'UG-REG-01', 'UG', N'Lyantonde', N'lyantonde',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-014')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Masaka',
           NormalizedName = N'masaka', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-014';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-014', N'UG-REG-01', 'UG', N'Masaka', N'masaka',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-015')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Mpigi',
           NormalizedName = N'mpigi', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-015';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-015', N'UG-REG-01', 'UG', N'Mpigi', N'mpigi',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-016')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Mubende',
           NormalizedName = N'mubende', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-016';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-016', N'UG-REG-01', 'UG', N'Mubende', N'mubende',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-017')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Mukono',
           NormalizedName = N'mukono', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-017';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-017', N'UG-REG-01', 'UG', N'Mukono', N'mukono',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-018')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Nakaseke',
           NormalizedName = N'nakaseke', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-018';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-018', N'UG-REG-01', 'UG', N'Nakaseke', N'nakaseke',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-019')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Nakasongola',
           NormalizedName = N'nakasongola', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-019';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-019', N'UG-REG-01', 'UG', N'Nakasongola', N'nakasongola',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-020')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Sembabule',
           NormalizedName = N'sembabule', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-020';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-020', N'UG-REG-01', 'UG', N'Sembabule', N'sembabule',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-021')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Wakiso',
           NormalizedName = N'wakiso', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-021';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-021', N'UG-REG-01', 'UG', N'Wakiso', N'wakiso',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-022')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Mityana',
           NormalizedName = N'mityana', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-022';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-022', N'UG-REG-01', 'UG', N'Mityana', N'mityana',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-023')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Kassanda',
           NormalizedName = N'kassanda', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-023';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-023', N'UG-REG-01', 'UG', N'Kassanda', N'kassanda',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-024')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Kyotera',
           NormalizedName = N'kyotera', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-024';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-024', N'UG-REG-01', 'UG', N'Kyotera', N'kyotera',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-025')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Rakai',
           NormalizedName = N'rakai', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-025';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-025', N'UG-REG-01', 'UG', N'Rakai', N'rakai',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-026')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Budaka',
           NormalizedName = N'budaka', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-026';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-026', N'UG-REG-02', 'UG', N'Budaka', N'budaka',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-027')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Bududa',
           NormalizedName = N'bududa', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-027';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-027', N'UG-REG-02', 'UG', N'Bududa', N'bududa',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-028')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Bugiri',
           NormalizedName = N'bugiri', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-028';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-028', N'UG-REG-02', 'UG', N'Bugiri', N'bugiri',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-029')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Bugweri',
           NormalizedName = N'bugweri', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-029';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-029', N'UG-REG-02', 'UG', N'Bugweri', N'bugweri',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-030')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Bukedea',
           NormalizedName = N'bukedea', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-030';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-030', N'UG-REG-02', 'UG', N'Bukedea', N'bukedea',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-031')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Bukwo',
           NormalizedName = N'bukwo', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-031';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-031', N'UG-REG-02', 'UG', N'Bukwo', N'bukwo',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-032')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Bulambuli',
           NormalizedName = N'bulambuli', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-032';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-032', N'UG-REG-02', 'UG', N'Bulambuli', N'bulambuli',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-033')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Busia',
           NormalizedName = N'busia', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-033';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-033', N'UG-REG-02', 'UG', N'Busia', N'busia',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-034')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Butaleja',
           NormalizedName = N'butaleja', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-034';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-034', N'UG-REG-02', 'UG', N'Butaleja', N'butaleja',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-035')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Butebo',
           NormalizedName = N'butebo', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-035';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-035', N'UG-REG-02', 'UG', N'Butebo', N'butebo',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-036')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Buyende',
           NormalizedName = N'buyende', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-036';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-036', N'UG-REG-02', 'UG', N'Buyende', N'buyende',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-037')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Iganga',
           NormalizedName = N'iganga', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-037';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-037', N'UG-REG-02', 'UG', N'Iganga', N'iganga',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-038')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Jinja',
           NormalizedName = N'jinja', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-038';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-038', N'UG-REG-02', 'UG', N'Jinja', N'jinja',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-039')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Kaliro',
           NormalizedName = N'kaliro', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-039';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-039', N'UG-REG-02', 'UG', N'Kaliro', N'kaliro',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-040')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Kamuli',
           NormalizedName = N'kamuli', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-040';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-040', N'UG-REG-02', 'UG', N'Kamuli', N'kamuli',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-041')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Kapchorwa',
           NormalizedName = N'kapchorwa', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-041';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-041', N'UG-REG-02', 'UG', N'Kapchorwa', N'kapchorwa',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-042')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Kapelebyong',
           NormalizedName = N'kapelebyong', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-042';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-042', N'UG-REG-02', 'UG', N'Kapelebyong', N'kapelebyong',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-043')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Katakwi',
           NormalizedName = N'katakwi', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-043';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-043', N'UG-REG-02', 'UG', N'Katakwi', N'katakwi',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-044')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Kibuku',
           NormalizedName = N'kibuku', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-044';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-044', N'UG-REG-02', 'UG', N'Kibuku', N'kibuku',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-045')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Kumi',
           NormalizedName = N'kumi', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-045';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-045', N'UG-REG-02', 'UG', N'Kumi', N'kumi',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-046')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Kween',
           NormalizedName = N'kween', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-046';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-046', N'UG-REG-02', 'UG', N'Kween', N'kween',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-047')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Luuka',
           NormalizedName = N'luuka', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-047';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-047', N'UG-REG-02', 'UG', N'Luuka', N'luuka',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-048')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Manafwa',
           NormalizedName = N'manafwa', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-048';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-048', N'UG-REG-02', 'UG', N'Manafwa', N'manafwa',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-049')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Mayuge',
           NormalizedName = N'mayuge', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-049';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-049', N'UG-REG-02', 'UG', N'Mayuge', N'mayuge',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-050')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Mbale',
           NormalizedName = N'mbale', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-050';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-050', N'UG-REG-02', 'UG', N'Mbale', N'mbale',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-051')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Namayingo',
           NormalizedName = N'namayingo', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-051';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-051', N'UG-REG-02', 'UG', N'Namayingo', N'namayingo',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-052')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Namisindwa',
           NormalizedName = N'namisindwa', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-052';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-052', N'UG-REG-02', 'UG', N'Namisindwa', N'namisindwa',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-053')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Namutumba',
           NormalizedName = N'namutumba', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-053';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-053', N'UG-REG-02', 'UG', N'Namutumba', N'namutumba',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-054')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Ngora',
           NormalizedName = N'ngora', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-054';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-054', N'UG-REG-02', 'UG', N'Ngora', N'ngora',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-055')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Pallisa',
           NormalizedName = N'pallisa', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-055';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-055', N'UG-REG-02', 'UG', N'Pallisa', N'pallisa',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-056')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Serere',
           NormalizedName = N'serere', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-056';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-056', N'UG-REG-02', 'UG', N'Serere', N'serere',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-057')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Sironko',
           NormalizedName = N'sironko', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-057';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-057', N'UG-REG-02', 'UG', N'Sironko', N'sironko',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-058')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Soroti',
           NormalizedName = N'soroti', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-058';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-058', N'UG-REG-02', 'UG', N'Soroti', N'soroti',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-059')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Tororo',
           NormalizedName = N'tororo', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-059';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-059', N'UG-REG-02', 'UG', N'Tororo', N'tororo',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-060')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-02', CountryCode = 'UG', Name = N'Amuria',
           NormalizedName = N'amuria', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-060';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-060', N'UG-REG-02', 'UG', N'Amuria', N'amuria',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-061')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Abim',
           NormalizedName = N'abim', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-061';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-061', N'UG-REG-03', 'UG', N'Abim', N'abim',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-062')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Adjumani',
           NormalizedName = N'adjumani', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-062';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-062', N'UG-REG-03', 'UG', N'Adjumani', N'adjumani',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-063')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Agago',
           NormalizedName = N'agago', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-063';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-063', N'UG-REG-03', 'UG', N'Agago', N'agago',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-064')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Alebtong',
           NormalizedName = N'alebtong', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-064';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-064', N'UG-REG-03', 'UG', N'Alebtong', N'alebtong',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-065')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Amolatar',
           NormalizedName = N'amolatar', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-065';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-065', N'UG-REG-03', 'UG', N'Amolatar', N'amolatar',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-066')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Amuru',
           NormalizedName = N'amuru', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-066';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-066', N'UG-REG-03', 'UG', N'Amuru', N'amuru',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-067')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Apac',
           NormalizedName = N'apac', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-067';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-067', N'UG-REG-03', 'UG', N'Apac', N'apac',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-068')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Dokolo',
           NormalizedName = N'dokolo', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-068';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-068', N'UG-REG-03', 'UG', N'Dokolo', N'dokolo',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-069')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Gulu',
           NormalizedName = N'gulu', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-069';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-069', N'UG-REG-03', 'UG', N'Gulu', N'gulu',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-070')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Kaberamaido',
           NormalizedName = N'kaberamaido', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-070';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-070', N'UG-REG-03', 'UG', N'Kaberamaido', N'kaberamaido',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-071')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Kalaki',
           NormalizedName = N'kalaki', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-071';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-071', N'UG-REG-03', 'UG', N'Kalaki', N'kalaki',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-072')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Kitgum',
           NormalizedName = N'kitgum', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-072';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-072', N'UG-REG-03', 'UG', N'Kitgum', N'kitgum',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-073')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Kole',
           NormalizedName = N'kole', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-073';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-073', N'UG-REG-03', 'UG', N'Kole', N'kole',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-074')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Kwania',
           NormalizedName = N'kwania', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-074';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-074', N'UG-REG-03', 'UG', N'Kwania', N'kwania',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-075')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Lamwo',
           NormalizedName = N'lamwo', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-075';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-075', N'UG-REG-03', 'UG', N'Lamwo', N'lamwo',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-076')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Lira',
           NormalizedName = N'lira', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-076';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-076', N'UG-REG-03', 'UG', N'Lira', N'lira',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-077')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Madi-Okollo',
           NormalizedName = N'madi-okollo', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-077';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-077', N'UG-REG-03', 'UG', N'Madi-Okollo', N'madi-okollo',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-078')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Maracha',
           NormalizedName = N'maracha', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-078';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-078', N'UG-REG-03', 'UG', N'Maracha', N'maracha',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-079')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Moyo',
           NormalizedName = N'moyo', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-079';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-079', N'UG-REG-03', 'UG', N'Moyo', N'moyo',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-080')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Nebbi',
           NormalizedName = N'nebbi', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-080';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-080', N'UG-REG-03', 'UG', N'Nebbi', N'nebbi',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-081')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Nwoya',
           NormalizedName = N'nwoya', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-081';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-081', N'UG-REG-03', 'UG', N'Nwoya', N'nwoya',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-082')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Obongi',
           NormalizedName = N'obongi', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-082';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-082', N'UG-REG-03', 'UG', N'Obongi', N'obongi',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-083')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Omoro',
           NormalizedName = N'omoro', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-083';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-083', N'UG-REG-03', 'UG', N'Omoro', N'omoro',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-084')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Otuke',
           NormalizedName = N'otuke', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-084';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-084', N'UG-REG-03', 'UG', N'Otuke', N'otuke',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-085')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Oyam',
           NormalizedName = N'oyam', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-085';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-085', N'UG-REG-03', 'UG', N'Oyam', N'oyam',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-086')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Pakwach',
           NormalizedName = N'pakwach', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = N'Packwach', Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-086';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-086', N'UG-REG-03', 'UG', N'Pakwach', N'pakwach',
            'ADMIN2', 2, N'Packwach', N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-087')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Pader',
           NormalizedName = N'pader', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-087';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-087', N'UG-REG-03', 'UG', N'Pader', N'pader',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-088')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Terego',
           NormalizedName = N'terego', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-088';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-088', N'UG-REG-03', 'UG', N'Terego', N'terego',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-089')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Yumbe',
           NormalizedName = N'yumbe', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-089';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-089', N'UG-REG-03', 'UG', N'Yumbe', N'yumbe',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-090')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Zombo',
           NormalizedName = N'zombo', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-090';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-090', N'UG-REG-03', 'UG', N'Zombo', N'zombo',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-091')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Arua',
           NormalizedName = N'arua', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-091';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-091', N'UG-REG-03', 'UG', N'Arua', N'arua',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-092')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Koboko',
           NormalizedName = N'koboko', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-092';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-092', N'UG-REG-03', 'UG', N'Koboko', N'koboko',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-093')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Karenga',
           NormalizedName = N'karenga', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-093';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-093', N'UG-REG-03', 'UG', N'Karenga', N'karenga',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-094')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Kaabong',
           NormalizedName = N'kaabong', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-094';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-094', N'UG-REG-03', 'UG', N'Kaabong', N'kaabong',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-095')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Kotido',
           NormalizedName = N'kotido', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-095';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-095', N'UG-REG-03', 'UG', N'Kotido', N'kotido',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-096')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Nabilatuk',
           NormalizedName = N'nabilatuk', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-096';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-096', N'UG-REG-03', 'UG', N'Nabilatuk', N'nabilatuk',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-097')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Nakapiripirit',
           NormalizedName = N'nakapiripirit', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-097';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-097', N'UG-REG-03', 'UG', N'Nakapiripirit', N'nakapiripirit',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-098')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Napak',
           NormalizedName = N'napak', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-098';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-098', N'UG-REG-03', 'UG', N'Napak', N'napak',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-099')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Moroto',
           NormalizedName = N'moroto', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-099';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-099', N'UG-REG-03', 'UG', N'Moroto', N'moroto',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-100')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-03', CountryCode = 'UG', Name = N'Amudat',
           NormalizedName = N'amudat', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-100';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-100', N'UG-REG-03', 'UG', N'Amudat', N'amudat',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-101')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Buhweju',
           NormalizedName = N'buhweju', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-101';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-101', N'UG-REG-04', 'UG', N'Buhweju', N'buhweju',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-102')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Buliisa',
           NormalizedName = N'buliisa', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-102';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-102', N'UG-REG-04', 'UG', N'Buliisa', N'buliisa',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-103')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Bundibugyo',
           NormalizedName = N'bundibugyo', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-103';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-103', N'UG-REG-04', 'UG', N'Bundibugyo', N'bundibugyo',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-104')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Bunyangabu',
           NormalizedName = N'bunyangabu', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-104';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-104', N'UG-REG-04', 'UG', N'Bunyangabu', N'bunyangabu',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-105')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Bushenyi',
           NormalizedName = N'bushenyi', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-105';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-105', N'UG-REG-04', 'UG', N'Bushenyi', N'bushenyi',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-106')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Hoima',
           NormalizedName = N'hoima', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-106';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-106', N'UG-REG-04', 'UG', N'Hoima', N'hoima',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-107')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Ibanda',
           NormalizedName = N'ibanda', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-107';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-107', N'UG-REG-04', 'UG', N'Ibanda', N'ibanda',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-108')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Isingiro',
           NormalizedName = N'isingiro', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-108';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-108', N'UG-REG-04', 'UG', N'Isingiro', N'isingiro',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-109')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Kabale',
           NormalizedName = N'kabale', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-109';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-109', N'UG-REG-04', 'UG', N'Kabale', N'kabale',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-110')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Kabarole',
           NormalizedName = N'kabarole', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-110';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-110', N'UG-REG-04', 'UG', N'Kabarole', N'kabarole',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-111')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Kagadi',
           NormalizedName = N'kagadi', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-111';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-111', N'UG-REG-04', 'UG', N'Kagadi', N'kagadi',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-112')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Kakumiro',
           NormalizedName = N'kakumiro', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-112';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-112', N'UG-REG-04', 'UG', N'Kakumiro', N'kakumiro',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-113')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Kamwenge',
           NormalizedName = N'kamwenge', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-113';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-113', N'UG-REG-04', 'UG', N'Kamwenge', N'kamwenge',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-114')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Kanungu',
           NormalizedName = N'kanungu', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-114';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-114', N'UG-REG-04', 'UG', N'Kanungu', N'kanungu',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-115')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Kasese',
           NormalizedName = N'kasese', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-115';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-115', N'UG-REG-04', 'UG', N'Kasese', N'kasese',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-116')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Kazo',
           NormalizedName = N'kazo', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-116';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-116', N'UG-REG-04', 'UG', N'Kazo', N'kazo',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-117')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Kibaale',
           NormalizedName = N'kibaale', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-117';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-117', N'UG-REG-04', 'UG', N'Kibaale', N'kibaale',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-118')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Kikuube',
           NormalizedName = N'kikuube', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-118';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-118', N'UG-REG-04', 'UG', N'Kikuube', N'kikuube',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-119')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Kiruhura',
           NormalizedName = N'kiruhura', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-119';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-119', N'UG-REG-04', 'UG', N'Kiruhura', N'kiruhura',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-120')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Kiryandongo',
           NormalizedName = N'kiryandongo', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-120';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-120', N'UG-REG-04', 'UG', N'Kiryandongo', N'kiryandongo',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-121')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Kisoro',
           NormalizedName = N'kisoro', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-121';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-121', N'UG-REG-04', 'UG', N'Kisoro', N'kisoro',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-122')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Kitagwenda',
           NormalizedName = N'kitagwenda', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-122';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-122', N'UG-REG-04', 'UG', N'Kitagwenda', N'kitagwenda',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-123')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Kyegegwa',
           NormalizedName = N'kyegegwa', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-123';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-123', N'UG-REG-04', 'UG', N'Kyegegwa', N'kyegegwa',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-124')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Kyenjojo',
           NormalizedName = N'kyenjojo', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-124';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-124', N'UG-REG-04', 'UG', N'Kyenjojo', N'kyenjojo',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-125')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Masindi',
           NormalizedName = N'masindi', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-125';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-125', N'UG-REG-04', 'UG', N'Masindi', N'masindi',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-126')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Mbarara',
           NormalizedName = N'mbarara', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-126';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-126', N'UG-REG-04', 'UG', N'Mbarara', N'mbarara',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-127')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Mitooma',
           NormalizedName = N'mitooma', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-127';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-127', N'UG-REG-04', 'UG', N'Mitooma', N'mitooma',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-128')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Ntoroko',
           NormalizedName = N'ntoroko', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-128';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-128', N'UG-REG-04', 'UG', N'Ntoroko', N'ntoroko',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-129')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Ntungamo',
           NormalizedName = N'ntungamo', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-129';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-129', N'UG-REG-04', 'UG', N'Ntungamo', N'ntungamo',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-130')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Rubanda',
           NormalizedName = N'rubanda', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-130';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-130', N'UG-REG-04', 'UG', N'Rubanda', N'rubanda',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-131')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Rubirizi',
           NormalizedName = N'rubirizi', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-131';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-131', N'UG-REG-04', 'UG', N'Rubirizi', N'rubirizi',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-132')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Rukiga',
           NormalizedName = N'rukiga', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-132';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-132', N'UG-REG-04', 'UG', N'Rukiga', N'rukiga',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-133')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Rukungiri',
           NormalizedName = N'rukungiri', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-133';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-133', N'UG-REG-04', 'UG', N'Rukungiri', N'rukungiri',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-134')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Rwampara',
           NormalizedName = N'rwampara', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-134';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-134', N'UG-REG-04', 'UG', N'Rwampara', N'rwampara',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-DIST-135')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-04', CountryCode = 'UG', Name = N'Sheema',
           NormalizedName = N'sheema', LocationType = 'ADMIN2',
           AdminLevel = 2, Aliases = NULL, Notes = N'District-level local government; verify current statutory status before production boundary use.'
     WHERE LocationCode = N'UG-DIST-135';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-DIST-135', N'UG-REG-04', 'UG', N'Sheema', N'sheema',
            'ADMIN2', 2, NULL, N'District-level local government; verify current statutory status before production boundary use.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-CITY-001')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-REG-01', CountryCode = 'UG', Name = N'Kampala',
           NormalizedName = N'kampala', LocationType = 'CITY',
           AdminLevel = 3, Aliases = N'Kampala Capital City|KCCA|Kampala CBD', Notes = N'Capital city and city authority; Kampala CBD is not treated as a separate district.'
     WHERE LocationCode = N'UG-CITY-001';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-CITY-001', N'UG-REG-01', 'UG', N'Kampala', N'kampala',
            'CITY', 3, N'Kampala Capital City|KCCA|Kampala CBD', N'Capital city and city authority; Kampala CBD is not treated as a separate district.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-CITY-002')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-091', CountryCode = 'UG', Name = N'Arua',
           NormalizedName = N'arua', LocationType = 'CITY',
           AdminLevel = 3, Aliases = N'Arua City', Notes = N'City authority; administrative boundaries may include divisions and surrounding urban areas.'
     WHERE LocationCode = N'UG-CITY-002';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-CITY-002', N'UG-DIST-091', 'UG', N'Arua', N'arua',
            'CITY', 3, N'Arua City', N'City authority; administrative boundaries may include divisions and surrounding urban areas.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-CITY-003')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-110', CountryCode = 'UG', Name = N'Fort Portal',
           NormalizedName = N'fort portal', LocationType = 'CITY',
           AdminLevel = 3, Aliases = N'Fort Portal City', Notes = N'City authority; administrative boundaries may include divisions and surrounding urban areas.'
     WHERE LocationCode = N'UG-CITY-003';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-CITY-003', N'UG-DIST-110', 'UG', N'Fort Portal', N'fort portal',
            'CITY', 3, N'Fort Portal City', N'City authority; administrative boundaries may include divisions and surrounding urban areas.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-CITY-004')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-069', CountryCode = 'UG', Name = N'Gulu',
           NormalizedName = N'gulu', LocationType = 'CITY',
           AdminLevel = 3, Aliases = N'Gulu City', Notes = N'City authority; administrative boundaries may include divisions and surrounding urban areas.'
     WHERE LocationCode = N'UG-CITY-004';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-CITY-004', N'UG-DIST-069', 'UG', N'Gulu', N'gulu',
            'CITY', 3, N'Gulu City', N'City authority; administrative boundaries may include divisions and surrounding urban areas.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-CITY-005')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-106', CountryCode = 'UG', Name = N'Hoima',
           NormalizedName = N'hoima', LocationType = 'CITY',
           AdminLevel = 3, Aliases = N'Hoima City', Notes = N'City authority; administrative boundaries may include divisions and surrounding urban areas.'
     WHERE LocationCode = N'UG-CITY-005';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-CITY-005', N'UG-DIST-106', 'UG', N'Hoima', N'hoima',
            'CITY', 3, N'Hoima City', N'City authority; administrative boundaries may include divisions and surrounding urban areas.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-CITY-006')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-038', CountryCode = 'UG', Name = N'Jinja',
           NormalizedName = N'jinja', LocationType = 'CITY',
           AdminLevel = 3, Aliases = N'Jinja City', Notes = N'City authority; administrative boundaries may include divisions and surrounding urban areas.'
     WHERE LocationCode = N'UG-CITY-006';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-CITY-006', N'UG-DIST-038', 'UG', N'Jinja', N'jinja',
            'CITY', 3, N'Jinja City', N'City authority; administrative boundaries may include divisions and surrounding urban areas.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-CITY-007')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-076', CountryCode = 'UG', Name = N'Lira',
           NormalizedName = N'lira', LocationType = 'CITY',
           AdminLevel = 3, Aliases = N'Lira City', Notes = N'City authority; administrative boundaries may include divisions and surrounding urban areas.'
     WHERE LocationCode = N'UG-CITY-007';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-CITY-007', N'UG-DIST-076', 'UG', N'Lira', N'lira',
            'CITY', 3, N'Lira City', N'City authority; administrative boundaries may include divisions and surrounding urban areas.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-CITY-008')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-014', CountryCode = 'UG', Name = N'Masaka',
           NormalizedName = N'masaka', LocationType = 'CITY',
           AdminLevel = 3, Aliases = N'Masaka City', Notes = N'City authority; administrative boundaries may include divisions and surrounding urban areas.'
     WHERE LocationCode = N'UG-CITY-008';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-CITY-008', N'UG-DIST-014', 'UG', N'Masaka', N'masaka',
            'CITY', 3, N'Masaka City', N'City authority; administrative boundaries may include divisions and surrounding urban areas.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-CITY-009')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-050', CountryCode = 'UG', Name = N'Mbale',
           NormalizedName = N'mbale', LocationType = 'CITY',
           AdminLevel = 3, Aliases = N'Mbale City', Notes = N'City authority; administrative boundaries may include divisions and surrounding urban areas.'
     WHERE LocationCode = N'UG-CITY-009';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-CITY-009', N'UG-DIST-050', 'UG', N'Mbale', N'mbale',
            'CITY', 3, N'Mbale City', N'City authority; administrative boundaries may include divisions and surrounding urban areas.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-CITY-010')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-126', CountryCode = 'UG', Name = N'Mbarara',
           NormalizedName = N'mbarara', LocationType = 'CITY',
           AdminLevel = 3, Aliases = N'Mbarara City', Notes = N'City authority; administrative boundaries may include divisions and surrounding urban areas.'
     WHERE LocationCode = N'UG-CITY-010';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-CITY-010', N'UG-DIST-126', 'UG', N'Mbarara', N'mbarara',
            'CITY', 3, N'Mbarara City', N'City authority; administrative boundaries may include divisions and surrounding urban areas.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-CITY-011')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-058', CountryCode = 'UG', Name = N'Soroti',
           NormalizedName = N'soroti', LocationType = 'CITY',
           AdminLevel = 3, Aliases = N'Soroti City', Notes = N'City authority; administrative boundaries may include divisions and surrounding urban areas.'
     WHERE LocationCode = N'UG-CITY-011';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-CITY-011', N'UG-DIST-058', 'UG', N'Soroti', N'soroti',
            'CITY', 3, N'Soroti City', N'City authority; administrative boundaries may include divisions and surrounding urban areas.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-001')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-021', CountryCode = 'UG', Name = N'Entebbe',
           NormalizedName = N'entebbe', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-001';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-001', N'UG-DIST-021', 'UG', N'Entebbe', N'entebbe',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-002')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-021', CountryCode = 'UG', Name = N'Kira',
           NormalizedName = N'kira', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-002';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-002', N'UG-DIST-021', 'UG', N'Kira', N'kira',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-003')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-021', CountryCode = 'UG', Name = N'Nansana',
           NormalizedName = N'nansana', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-003';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-003', N'UG-DIST-021', 'UG', N'Nansana', N'nansana',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-004')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-021', CountryCode = 'UG', Name = N'Kajjansi',
           NormalizedName = N'kajjansi', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-004';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-004', N'UG-DIST-021', 'UG', N'Kajjansi', N'kajjansi',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-005')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-021', CountryCode = 'UG', Name = N'Kakiri',
           NormalizedName = N'kakiri', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-005';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-005', N'UG-DIST-021', 'UG', N'Kakiri', N'kakiri',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-006')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-021', CountryCode = 'UG', Name = N'Kasangati',
           NormalizedName = N'kasangati', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-006';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-006', N'UG-DIST-021', 'UG', N'Kasangati', N'kasangati',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-007')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-021', CountryCode = 'UG', Name = N'Matugga',
           NormalizedName = N'matugga', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-007';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-007', N'UG-DIST-021', 'UG', N'Matugga', N'matugga',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-008')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-021', CountryCode = 'UG', Name = N'Buloba',
           NormalizedName = N'buloba', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-008';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-008', N'UG-DIST-021', 'UG', N'Buloba', N'buloba',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-009')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-017', CountryCode = 'UG', Name = N'Njeru',
           NormalizedName = N'njeru', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-009';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-009', N'UG-DIST-017', 'UG', N'Njeru', N'njeru',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-010')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-017', CountryCode = 'UG', Name = N'Seeta',
           NormalizedName = N'seeta', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-010';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-010', N'UG-DIST-017', 'UG', N'Seeta', N'seeta',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-011')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-017', CountryCode = 'UG', Name = N'Katosi',
           NormalizedName = N'katosi', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-011';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-011', N'UG-DIST-017', 'UG', N'Katosi', N'katosi',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-012')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-001', CountryCode = 'UG', Name = N'Lugazi',
           NormalizedName = N'lugazi', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-012';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-012', N'UG-DIST-001', 'UG', N'Lugazi', N'lugazi',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-013')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-001', CountryCode = 'UG', Name = N'Nkokonjeru',
           NormalizedName = N'nkokonjeru', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-013';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-013', N'UG-DIST-001', 'UG', N'Nkokonjeru', N'nkokonjeru',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-014')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-011', CountryCode = 'UG', Name = N'Wobulenzi',
           NormalizedName = N'wobulenzi', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-014';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-014', N'UG-DIST-011', 'UG', N'Wobulenzi', N'wobulenzi',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-015')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-011', CountryCode = 'UG', Name = N'Bombo',
           NormalizedName = N'bombo', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-015';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-015', N'UG-DIST-011', 'UG', N'Bombo', N'bombo',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-016')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-015', CountryCode = 'UG', Name = N'Buwama',
           NormalizedName = N'buwama', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-016';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-016', N'UG-DIST-015', 'UG', N'Buwama', N'buwama',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-017')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-014', CountryCode = 'UG', Name = N'Nyendo',
           NormalizedName = N'nyendo', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-017';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-017', N'UG-DIST-014', 'UG', N'Nyendo', N'nyendo',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-018')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-014', CountryCode = 'UG', Name = N'Lukaya',
           NormalizedName = N'lukaya', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-018';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-018', N'UG-DIST-014', 'UG', N'Lukaya', N'lukaya',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-019')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-025', CountryCode = 'UG', Name = N'Kalisizo',
           NormalizedName = N'kalisizo', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-019';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-019', N'UG-DIST-025', 'UG', N'Kalisizo', N'kalisizo',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-020')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-025', CountryCode = 'UG', Name = N'Kyotera',
           NormalizedName = N'kyotera', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-020';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-020', N'UG-DIST-025', 'UG', N'Kyotera', N'kyotera',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-021')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-008', CountryCode = 'UG', Name = N'Bbaale',
           NormalizedName = N'bbaale', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-021';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-021', N'UG-DIST-008', 'UG', N'Bbaale', N'bbaale',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-022')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-018', CountryCode = 'UG', Name = N'Kapeeka',
           NormalizedName = N'kapeeka', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-022';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-022', N'UG-DIST-018', 'UG', N'Kapeeka', N'kapeeka',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-023')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-005', CountryCode = 'UG', Name = N'Kanoni',
           NormalizedName = N'kanoni', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-023';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-023', N'UG-DIST-005', 'UG', N'Kanoni', N'kanoni',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-024')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-038', CountryCode = 'UG', Name = N'Bugembe',
           NormalizedName = N'bugembe', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-024';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-024', N'UG-DIST-038', 'UG', N'Bugembe', N'bugembe',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-025')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-038', CountryCode = 'UG', Name = N'Kakira',
           NormalizedName = N'kakira', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-025';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-025', N'UG-DIST-038', 'UG', N'Kakira', N'kakira',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-026')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-038', CountryCode = 'UG', Name = N'Wanyange',
           NormalizedName = N'wanyange', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-026';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-026', N'UG-DIST-038', 'UG', N'Wanyange', N'wanyange',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-027')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-059', CountryCode = 'UG', Name = N'Malaba',
           NormalizedName = N'malaba', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-027';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-027', N'UG-DIST-059', 'UG', N'Malaba', N'malaba',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-028')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-050', CountryCode = 'UG', Name = N'Namatala',
           NormalizedName = N'namatala', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-028';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-028', N'UG-DIST-050', 'UG', N'Namatala', N'namatala',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-029')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-048', CountryCode = 'UG', Name = N'Bubulo',
           NormalizedName = N'bubulo', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-029';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-029', N'UG-DIST-048', 'UG', N'Bubulo', N'bubulo',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-030')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-047', CountryCode = 'UG', Name = N'Businge',
           NormalizedName = N'businge', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-030';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-030', N'UG-DIST-047', 'UG', N'Businge', N'businge',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-031')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-046', CountryCode = 'UG', Name = N'Binyiny',
           NormalizedName = N'binyiny', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-031';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-031', N'UG-DIST-046', 'UG', N'Binyiny', N'binyiny',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-032')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-032', CountryCode = 'UG', Name = N'Muyembe',
           NormalizedName = N'muyembe', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-032';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-032', N'UG-DIST-032', 'UG', N'Muyembe', N'muyembe',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-033')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-081', CountryCode = 'UG', Name = N'Anaka',
           NormalizedName = N'anaka', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-033';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-033', N'UG-DIST-081', 'UG', N'Anaka', N'anaka',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-034')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-075', CountryCode = 'UG', Name = N'Palabek',
           NormalizedName = N'palabek', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-034';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-034', N'UG-DIST-075', 'UG', N'Palabek', N'palabek',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-035')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-063', CountryCode = 'UG', Name = N'Patongo',
           NormalizedName = N'patongo', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-035';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-035', N'UG-DIST-063', 'UG', N'Patongo', N'patongo',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-036')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-115', CountryCode = 'UG', Name = N'Hima',
           NormalizedName = N'hima', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-036';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-036', N'UG-DIST-115', 'UG', N'Hima', N'hima',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-037')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-105', CountryCode = 'UG', Name = N'Ishaka',
           NormalizedName = N'ishaka', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-037';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-037', N'UG-DIST-105', 'UG', N'Ishaka', N'ishaka',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-038')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-110', CountryCode = 'UG', Name = N'Kiko',
           NormalizedName = N'kiko', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-038';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-038', N'UG-DIST-110', 'UG', N'Kiko', N'kiko',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-039')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-120', CountryCode = 'UG', Name = N'Bweyale',
           NormalizedName = N'bweyale', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-039';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-039', N'UG-DIST-120', 'UG', N'Bweyale', N'bweyale',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-040')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-108', CountryCode = 'UG', Name = N'Rugaaga',
           NormalizedName = N'rugaaga', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-040';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-040', N'UG-DIST-108', 'UG', N'Rugaaga', N'rugaaga',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-041')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-119', CountryCode = 'UG', Name = N'Rushere',
           NormalizedName = N'rushere', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-041';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-041', N'UG-DIST-119', 'UG', N'Rushere', N'rushere',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-042')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-135', CountryCode = 'UG', Name = N'Kabwohe',
           NormalizedName = N'kabwohe', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-042';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-042', N'UG-DIST-135', 'UG', N'Kabwohe', N'kabwohe',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-043')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-132', CountryCode = 'UG', Name = N'Muhanga',
           NormalizedName = N'muhanga', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-043';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-043', N'UG-DIST-132', 'UG', N'Muhanga', N'muhanga',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-044')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-134', CountryCode = 'UG', Name = N'Ndeija',
           NormalizedName = N'ndeija', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-044';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-044', N'UG-DIST-134', 'UG', N'Ndeija', N'ndeija',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-045')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-128', CountryCode = 'UG', Name = N'Karugutu',
           NormalizedName = N'karugutu', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-045';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-045', N'UG-DIST-128', 'UG', N'Karugutu', N'karugutu',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-046')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-104', CountryCode = 'UG', Name = N'Kibito',
           NormalizedName = N'kibito', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-046';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-046', N'UG-DIST-104', 'UG', N'Kibito', N'kibito',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-047')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-101', CountryCode = 'UG', Name = N'Rwengwe',
           NormalizedName = N'rwengwe', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-047';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-047', N'UG-DIST-101', 'UG', N'Rwengwe', N'rwengwe',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-TOWN-048')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-DIST-122', CountryCode = 'UG', Name = N'Ntara',
           NormalizedName = N'ntara', LocationType = 'TOWN',
           AdminLevel = 3, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-TOWN-048';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-TOWN-048', N'UG-DIST-122', 'UG', N'Ntara', N'ntara',
            'TOWN', 3, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-001', CountryCode = 'UG', Name = N'Central Division',
           NormalizedName = N'central division', LocationType = 'DIVISION',
           AdminLevel = 4, Aliases = N'Central', Notes = N'Kampala Capital City urban division.'
     WHERE LocationCode = N'UG-KLA-DIV-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-01', N'UG-CITY-001', 'UG', N'Central Division', N'central division',
            'DIVISION', 4, N'Central', N'Kampala Capital City urban division.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-001', CountryCode = 'UG', Name = N'Kawempe Division',
           NormalizedName = N'kawempe division', LocationType = 'DIVISION',
           AdminLevel = 4, Aliases = N'Kawempe', Notes = N'Kampala Capital City urban division.'
     WHERE LocationCode = N'UG-KLA-DIV-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-02', N'UG-CITY-001', 'UG', N'Kawempe Division', N'kawempe division',
            'DIVISION', 4, N'Kawempe', N'Kampala Capital City urban division.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-001', CountryCode = 'UG', Name = N'Makindye Division',
           NormalizedName = N'makindye division', LocationType = 'DIVISION',
           AdminLevel = 4, Aliases = N'Makindye', Notes = N'Kampala Capital City urban division.'
     WHERE LocationCode = N'UG-KLA-DIV-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-03', N'UG-CITY-001', 'UG', N'Makindye Division', N'makindye division',
            'DIVISION', 4, N'Makindye', N'Kampala Capital City urban division.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-001', CountryCode = 'UG', Name = N'Nakawa Division',
           NormalizedName = N'nakawa division', LocationType = 'DIVISION',
           AdminLevel = 4, Aliases = N'Nakawa', Notes = N'Kampala Capital City urban division.'
     WHERE LocationCode = N'UG-KLA-DIV-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-04', N'UG-CITY-001', 'UG', N'Nakawa Division', N'nakawa division',
            'DIVISION', 4, N'Nakawa', N'Kampala Capital City urban division.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-001', CountryCode = 'UG', Name = N'Rubaga Division',
           NormalizedName = N'rubaga division', LocationType = 'DIVISION',
           AdminLevel = 4, Aliases = N'Rubaga', Notes = N'Kampala Capital City urban division.'
     WHERE LocationCode = N'UG-KLA-DIV-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-05', N'UG-CITY-001', 'UG', N'Rubaga Division', N'rubaga division',
            'DIVISION', 4, N'Rubaga', N'Kampala Capital City urban division.');

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-01-NBH-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-01', CountryCode = 'UG', Name = N'Nakasero',
           NormalizedName = N'nakasero', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-01-NBH-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-01-NBH-01', N'UG-KLA-DIV-01', 'UG', N'Nakasero', N'nakasero',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-01-NBH-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-01', CountryCode = 'UG', Name = N'Kololo',
           NormalizedName = N'kololo', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-01-NBH-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-01-NBH-02', N'UG-KLA-DIV-01', 'UG', N'Kololo', N'kololo',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-01-NBH-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-01', CountryCode = 'UG', Name = N'Old Kampala',
           NormalizedName = N'old kampala', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-01-NBH-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-01-NBH-03', N'UG-KLA-DIV-01', 'UG', N'Old Kampala', N'old kampala',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-01-NBH-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-01', CountryCode = 'UG', Name = N'Kisenyi',
           NormalizedName = N'kisenyi', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-01-NBH-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-01-NBH-04', N'UG-KLA-DIV-01', 'UG', N'Kisenyi', N'kisenyi',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-01-NBH-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-01', CountryCode = 'UG', Name = N'Wandegeya',
           NormalizedName = N'wandegeya', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-01-NBH-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-01-NBH-05', N'UG-KLA-DIV-01', 'UG', N'Wandegeya', N'wandegeya',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-01-NBH-06')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-01', CountryCode = 'UG', Name = N'Makerere',
           NormalizedName = N'makerere', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-01-NBH-06';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-01-NBH-06', N'UG-KLA-DIV-01', 'UG', N'Makerere', N'makerere',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-01-NBH-07')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-01', CountryCode = 'UG', Name = N'Kamwokya',
           NormalizedName = N'kamwokya', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-01-NBH-07';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-01-NBH-07', N'UG-KLA-DIV-01', 'UG', N'Kamwokya', N'kamwokya',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-01-NBH-08')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-01', CountryCode = 'UG', Name = N'Industrial Area',
           NormalizedName = N'industrial area', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-01-NBH-08';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-01-NBH-08', N'UG-KLA-DIV-01', 'UG', N'Industrial Area', N'industrial area',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-01-NBH-09')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-01', CountryCode = 'UG', Name = N'Civic Centre',
           NormalizedName = N'civic centre', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-01-NBH-09';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-01-NBH-09', N'UG-KLA-DIV-01', 'UG', N'Civic Centre', N'civic centre',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-02-NBH-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-02', CountryCode = 'UG', Name = N'Kawempe',
           NormalizedName = N'kawempe', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-02-NBH-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-02-NBH-01', N'UG-KLA-DIV-02', 'UG', N'Kawempe', N'kawempe',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-02-NBH-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-02', CountryCode = 'UG', Name = N'Bwaise',
           NormalizedName = N'bwaise', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-02-NBH-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-02-NBH-02', N'UG-KLA-DIV-02', 'UG', N'Bwaise', N'bwaise',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-02-NBH-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-02', CountryCode = 'UG', Name = N'Kalerwe',
           NormalizedName = N'kalerwe', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-02-NBH-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-02-NBH-03', N'UG-KLA-DIV-02', 'UG', N'Kalerwe', N'kalerwe',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-02-NBH-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-02', CountryCode = 'UG', Name = N'Kanyanya',
           NormalizedName = N'kanyanya', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-02-NBH-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-02-NBH-04', N'UG-KLA-DIV-02', 'UG', N'Kanyanya', N'kanyanya',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-02-NBH-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-02', CountryCode = 'UG', Name = N'Kazo',
           NormalizedName = N'kazo', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-02-NBH-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-02-NBH-05', N'UG-KLA-DIV-02', 'UG', N'Kazo', N'kazo',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-02-NBH-06')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-02', CountryCode = 'UG', Name = N'Kyebando',
           NormalizedName = N'kyebando', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-02-NBH-06';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-02-NBH-06', N'UG-KLA-DIV-02', 'UG', N'Kyebando', N'kyebando',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-02-NBH-07')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-02', CountryCode = 'UG', Name = N'Komamboga',
           NormalizedName = N'komamboga', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-02-NBH-07';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-02-NBH-07', N'UG-KLA-DIV-02', 'UG', N'Komamboga', N'komamboga',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-03-NBH-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-03', CountryCode = 'UG', Name = N'Muyenga',
           NormalizedName = N'muyenga', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-03-NBH-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-03-NBH-01', N'UG-KLA-DIV-03', 'UG', N'Muyenga', N'muyenga',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-03-NBH-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-03', CountryCode = 'UG', Name = N'Kansanga',
           NormalizedName = N'kansanga', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-03-NBH-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-03-NBH-02', N'UG-KLA-DIV-03', 'UG', N'Kansanga', N'kansanga',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-03-NBH-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-03', CountryCode = 'UG', Name = N'Kabalagala',
           NormalizedName = N'kabalagala', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-03-NBH-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-03-NBH-03', N'UG-KLA-DIV-03', 'UG', N'Kabalagala', N'kabalagala',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-03-NBH-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-03', CountryCode = 'UG', Name = N'Nsambya',
           NormalizedName = N'nsambya', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-03-NBH-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-03-NBH-04', N'UG-KLA-DIV-03', 'UG', N'Nsambya', N'nsambya',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-03-NBH-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-03', CountryCode = 'UG', Name = N'Kibuli',
           NormalizedName = N'kibuli', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-03-NBH-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-03-NBH-05', N'UG-KLA-DIV-03', 'UG', N'Kibuli', N'kibuli',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-03-NBH-06')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-03', CountryCode = 'UG', Name = N'Lukuli',
           NormalizedName = N'lukuli', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-03-NBH-06';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-03-NBH-06', N'UG-KLA-DIV-03', 'UG', N'Lukuli', N'lukuli',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-03-NBH-07')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-03', CountryCode = 'UG', Name = N'Bunga',
           NormalizedName = N'bunga', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-03-NBH-07';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-03-NBH-07', N'UG-KLA-DIV-03', 'UG', N'Bunga', N'bunga',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-03-NBH-08')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-03', CountryCode = 'UG', Name = N'Munyonyo',
           NormalizedName = N'munyonyo', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-03-NBH-08';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-03-NBH-08', N'UG-KLA-DIV-03', 'UG', N'Munyonyo', N'munyonyo',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-03-NBH-09')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-03', CountryCode = 'UG', Name = N'Ggaba',
           NormalizedName = N'ggaba', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-03-NBH-09';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-03-NBH-09', N'UG-KLA-DIV-03', 'UG', N'Ggaba', N'ggaba',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-04-NBH-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-04', CountryCode = 'UG', Name = N'Ntinda',
           NormalizedName = N'ntinda', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-04-NBH-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-04-NBH-01', N'UG-KLA-DIV-04', 'UG', N'Ntinda', N'ntinda',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-04-NBH-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-04', CountryCode = 'UG', Name = N'Naguru',
           NormalizedName = N'naguru', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-04-NBH-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-04-NBH-02', N'UG-KLA-DIV-04', 'UG', N'Naguru', N'naguru',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-04-NBH-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-04', CountryCode = 'UG', Name = N'Bugolobi',
           NormalizedName = N'bugolobi', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-04-NBH-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-04-NBH-03', N'UG-KLA-DIV-04', 'UG', N'Bugolobi', N'bugolobi',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-04-NBH-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-04', CountryCode = 'UG', Name = N'Luzira',
           NormalizedName = N'luzira', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-04-NBH-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-04-NBH-04', N'UG-KLA-DIV-04', 'UG', N'Luzira', N'luzira',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-04-NBH-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-04', CountryCode = 'UG', Name = N'Butabika',
           NormalizedName = N'butabika', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-04-NBH-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-04-NBH-05', N'UG-KLA-DIV-04', 'UG', N'Butabika', N'butabika',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-04-NBH-06')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-04', CountryCode = 'UG', Name = N'Mbuya',
           NormalizedName = N'mbuya', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-04-NBH-06';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-04-NBH-06', N'UG-KLA-DIV-04', 'UG', N'Mbuya', N'mbuya',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-04-NBH-07')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-04', CountryCode = 'UG', Name = N'Nakawa',
           NormalizedName = N'nakawa', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-04-NBH-07';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-04-NBH-07', N'UG-KLA-DIV-04', 'UG', N'Nakawa', N'nakawa',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-04-NBH-08')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-04', CountryCode = 'UG', Name = N'Kireka',
           NormalizedName = N'kireka', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-04-NBH-08';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-04-NBH-08', N'UG-KLA-DIV-04', 'UG', N'Kireka', N'kireka',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-04-NBH-09')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-04', CountryCode = 'UG', Name = N'Banda',
           NormalizedName = N'banda', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-04-NBH-09';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-04-NBH-09', N'UG-KLA-DIV-04', 'UG', N'Banda', N'banda',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-04-NBH-10')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-04', CountryCode = 'UG', Name = N'Kyambogo',
           NormalizedName = N'kyambogo', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-04-NBH-10';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-04-NBH-10', N'UG-KLA-DIV-04', 'UG', N'Kyambogo', N'kyambogo',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-04-NBH-11')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-04', CountryCode = 'UG', Name = N'Namugongo',
           NormalizedName = N'namugongo', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-04-NBH-11';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-04-NBH-11', N'UG-KLA-DIV-04', 'UG', N'Namugongo', N'namugongo',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-05-NBH-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-05', CountryCode = 'UG', Name = N'Rubaga',
           NormalizedName = N'rubaga', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-05-NBH-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-05-NBH-01', N'UG-KLA-DIV-05', 'UG', N'Rubaga', N'rubaga',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-05-NBH-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-05', CountryCode = 'UG', Name = N'Mengo',
           NormalizedName = N'mengo', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-05-NBH-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-05-NBH-02', N'UG-KLA-DIV-05', 'UG', N'Mengo', N'mengo',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-05-NBH-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-05', CountryCode = 'UG', Name = N'Kasubi',
           NormalizedName = N'kasubi', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-05-NBH-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-05-NBH-03', N'UG-KLA-DIV-05', 'UG', N'Kasubi', N'kasubi',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-05-NBH-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-05', CountryCode = 'UG', Name = N'Lubiri',
           NormalizedName = N'lubiri', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-05-NBH-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-05-NBH-04', N'UG-KLA-DIV-05', 'UG', N'Lubiri', N'lubiri',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-05-NBH-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-05', CountryCode = 'UG', Name = N'Nateete',
           NormalizedName = N'nateete', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-05-NBH-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-05-NBH-05', N'UG-KLA-DIV-05', 'UG', N'Nateete', N'nateete',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-05-NBH-06')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-05', CountryCode = 'UG', Name = N'Busega',
           NormalizedName = N'busega', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-05-NBH-06';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-05-NBH-06', N'UG-KLA-DIV-05', 'UG', N'Busega', N'busega',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-05-NBH-07')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-05', CountryCode = 'UG', Name = N'Ndeeba',
           NormalizedName = N'ndeeba', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-05-NBH-07';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-05-NBH-07', N'UG-KLA-DIV-05', 'UG', N'Ndeeba', N'ndeeba',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-05-NBH-08')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-05', CountryCode = 'UG', Name = N'Lungujja',
           NormalizedName = N'lungujja', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-05-NBH-08';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-05-NBH-08', N'UG-KLA-DIV-05', 'UG', N'Lungujja', N'lungujja',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-05-NBH-09')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-05', CountryCode = 'UG', Name = N'Mutundwe',
           NormalizedName = N'mutundwe', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-05-NBH-09';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-05-NBH-09', N'UG-KLA-DIV-05', 'UG', N'Mutundwe', N'mutundwe',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-KLA-DIV-05-NBH-10')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-KLA-DIV-05', CountryCode = 'UG', Name = N'Najjanankumbi',
           NormalizedName = N'najjanankumbi', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 5, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-KLA-DIV-05-NBH-10';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-KLA-DIV-05-NBH-10', N'UG-KLA-DIV-05', 'UG', N'Najjanankumbi', N'najjanankumbi',
            'NEIGHBOURHOOD', 5, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-JINJA-NBH-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-006', CountryCode = 'UG', Name = N'Mpumudde',
           NormalizedName = N'mpumudde', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-JINJA-NBH-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-JINJA-NBH-01', N'UG-CITY-006', 'UG', N'Mpumudde', N'mpumudde',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-JINJA-NBH-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-006', CountryCode = 'UG', Name = N'Walukuba',
           NormalizedName = N'walukuba', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-JINJA-NBH-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-JINJA-NBH-02', N'UG-CITY-006', 'UG', N'Walukuba', N'walukuba',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-JINJA-NBH-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-006', CountryCode = 'UG', Name = N'Masese',
           NormalizedName = N'masese', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-JINJA-NBH-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-JINJA-NBH-03', N'UG-CITY-006', 'UG', N'Masese', N'masese',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-JINJA-NBH-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-006', CountryCode = 'UG', Name = N'Bugembe',
           NormalizedName = N'bugembe', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-JINJA-NBH-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-JINJA-NBH-04', N'UG-CITY-006', 'UG', N'Bugembe', N'bugembe',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-JINJA-NBH-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-006', CountryCode = 'UG', Name = N'Kimaka',
           NormalizedName = N'kimaka', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-JINJA-NBH-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-JINJA-NBH-05', N'UG-CITY-006', 'UG', N'Kimaka', N'kimaka',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-MBARA-NBH-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-010', CountryCode = 'UG', Name = N'Kakoba',
           NormalizedName = N'kakoba', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-MBARA-NBH-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-MBARA-NBH-01', N'UG-CITY-010', 'UG', N'Kakoba', N'kakoba',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-MBARA-NBH-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-010', CountryCode = 'UG', Name = N'Nyamitanga',
           NormalizedName = N'nyamitanga', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-MBARA-NBH-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-MBARA-NBH-02', N'UG-CITY-010', 'UG', N'Nyamitanga', N'nyamitanga',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-MBARA-NBH-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-010', CountryCode = 'UG', Name = N'Kakiika',
           NormalizedName = N'kakiika', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-MBARA-NBH-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-MBARA-NBH-03', N'UG-CITY-010', 'UG', N'Kakiika', N'kakiika',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-MBARA-NBH-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-010', CountryCode = 'UG', Name = N'Biharwe',
           NormalizedName = N'biharwe', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-MBARA-NBH-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-MBARA-NBH-04', N'UG-CITY-010', 'UG', N'Biharwe', N'biharwe',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-MBARA-NBH-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-010', CountryCode = 'UG', Name = N'Ruti',
           NormalizedName = N'ruti', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-MBARA-NBH-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-MBARA-NBH-05', N'UG-CITY-010', 'UG', N'Ruti', N'ruti',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-GULU-NBH-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-004', CountryCode = 'UG', Name = N'Pece',
           NormalizedName = N'pece', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-GULU-NBH-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-GULU-NBH-01', N'UG-CITY-004', 'UG', N'Pece', N'pece',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-GULU-NBH-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-004', CountryCode = 'UG', Name = N'Layibi',
           NormalizedName = N'layibi', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-GULU-NBH-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-GULU-NBH-02', N'UG-CITY-004', 'UG', N'Layibi', N'layibi',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-GULU-NBH-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-004', CountryCode = 'UG', Name = N'Bardege',
           NormalizedName = N'bardege', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-GULU-NBH-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-GULU-NBH-03', N'UG-CITY-004', 'UG', N'Bardege', N'bardege',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-GULU-NBH-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-004', CountryCode = 'UG', Name = N'Laroo',
           NormalizedName = N'laroo', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-GULU-NBH-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-GULU-NBH-04', N'UG-CITY-004', 'UG', N'Laroo', N'laroo',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-GULU-NBH-05')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-004', CountryCode = 'UG', Name = N'Unyama',
           NormalizedName = N'unyama', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-GULU-NBH-05';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-GULU-NBH-05', N'UG-CITY-004', 'UG', N'Unyama', N'unyama',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-MBALE-NBH-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-009', CountryCode = 'UG', Name = N'Industrial Area',
           NormalizedName = N'industrial area', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-MBALE-NBH-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-MBALE-NBH-01', N'UG-CITY-009', 'UG', N'Industrial Area', N'industrial area',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-MBALE-NBH-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-009', CountryCode = 'UG', Name = N'Namatala',
           NormalizedName = N'namatala', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-MBALE-NBH-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-MBALE-NBH-02', N'UG-CITY-009', 'UG', N'Namatala', N'namatala',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-MBALE-NBH-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-009', CountryCode = 'UG', Name = N'Nkonkojeru',
           NormalizedName = N'nkonkojeru', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-MBALE-NBH-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-MBALE-NBH-03', N'UG-CITY-009', 'UG', N'Nkonkojeru', N'nkonkojeru',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-MBALE-NBH-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-009', CountryCode = 'UG', Name = N'Malukhu',
           NormalizedName = N'malukhu', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-MBALE-NBH-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-MBALE-NBH-04', N'UG-CITY-009', 'UG', N'Malukhu', N'malukhu',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-FORTP-NBH-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-003', CountryCode = 'UG', Name = N'Kahungabunyonyi',
           NormalizedName = N'kahungabunyonyi', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-FORTP-NBH-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-FORTP-NBH-01', N'UG-CITY-003', 'UG', N'Kahungabunyonyi', N'kahungabunyonyi',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-FORTP-NBH-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-003', CountryCode = 'UG', Name = N'Kijura',
           NormalizedName = N'kijura', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-FORTP-NBH-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-FORTP-NBH-02', N'UG-CITY-003', 'UG', N'Kijura', N'kijura',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-FORTP-NBH-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-003', CountryCode = 'UG', Name = N'Harubaho',
           NormalizedName = N'harubaho', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-FORTP-NBH-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-FORTP-NBH-03', N'UG-CITY-003', 'UG', N'Harubaho', N'harubaho',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-FORTP-NBH-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-003', CountryCode = 'UG', Name = N'Boma',
           NormalizedName = N'boma', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-FORTP-NBH-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-FORTP-NBH-04', N'UG-CITY-003', 'UG', N'Boma', N'boma',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-ARUA-NBH-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-002', CountryCode = 'UG', Name = N'Oli',
           NormalizedName = N'oli', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-ARUA-NBH-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-ARUA-NBH-01', N'UG-CITY-002', 'UG', N'Oli', N'oli',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-ARUA-NBH-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-002', CountryCode = 'UG', Name = N'Pajulu',
           NormalizedName = N'pajulu', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-ARUA-NBH-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-ARUA-NBH-02', N'UG-CITY-002', 'UG', N'Pajulu', N'pajulu',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-ARUA-NBH-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-002', CountryCode = 'UG', Name = N'River Oli',
           NormalizedName = N'river oli', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-ARUA-NBH-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-ARUA-NBH-03', N'UG-CITY-002', 'UG', N'River Oli', N'river oli',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-ARUA-NBH-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-002', CountryCode = 'UG', Name = N'Ediofe',
           NormalizedName = N'ediofe', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-ARUA-NBH-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-ARUA-NBH-04', N'UG-CITY-002', 'UG', N'Ediofe', N'ediofe',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-HOIMA-NBH-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-005', CountryCode = 'UG', Name = N'Kiryatete',
           NormalizedName = N'kiryatete', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-HOIMA-NBH-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-HOIMA-NBH-01', N'UG-CITY-005', 'UG', N'Kiryatete', N'kiryatete',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-HOIMA-NBH-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-005', CountryCode = 'UG', Name = N'Bujumbura',
           NormalizedName = N'bujumbura', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-HOIMA-NBH-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-HOIMA-NBH-02', N'UG-CITY-005', 'UG', N'Bujumbura', N'bujumbura',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-HOIMA-NBH-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-005', CountryCode = 'UG', Name = N'Mparo',
           NormalizedName = N'mparo', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-HOIMA-NBH-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-HOIMA-NBH-03', N'UG-CITY-005', 'UG', N'Mparo', N'mparo',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-HOIMA-NBH-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-005', CountryCode = 'UG', Name = N'Kibingo',
           NormalizedName = N'kibingo', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-HOIMA-NBH-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-HOIMA-NBH-04', N'UG-CITY-005', 'UG', N'Kibingo', N'kibingo',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-MASAK-NBH-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-008', CountryCode = 'UG', Name = N'Nyendo',
           NormalizedName = N'nyendo', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-MASAK-NBH-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-MASAK-NBH-01', N'UG-CITY-008', 'UG', N'Nyendo', N'nyendo',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-MASAK-NBH-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-008', CountryCode = 'UG', Name = N'Kijjabwemi',
           NormalizedName = N'kijjabwemi', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-MASAK-NBH-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-MASAK-NBH-02', N'UG-CITY-008', 'UG', N'Kijjabwemi', N'kijjabwemi',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-MASAK-NBH-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-008', CountryCode = 'UG', Name = N'Katwe',
           NormalizedName = N'katwe', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-MASAK-NBH-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-MASAK-NBH-03', N'UG-CITY-008', 'UG', N'Katwe', N'katwe',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-LIRA-NBH-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-007', CountryCode = 'UG', Name = N'Adyel',
           NormalizedName = N'adyel', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-LIRA-NBH-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-LIRA-NBH-01', N'UG-CITY-007', 'UG', N'Adyel', N'adyel',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-LIRA-NBH-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-007', CountryCode = 'UG', Name = N'Railway',
           NormalizedName = N'railway', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-LIRA-NBH-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-LIRA-NBH-02', N'UG-CITY-007', 'UG', N'Railway', N'railway',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-LIRA-NBH-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-007', CountryCode = 'UG', Name = N'Ojwina',
           NormalizedName = N'ojwina', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-LIRA-NBH-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-LIRA-NBH-03', N'UG-CITY-007', 'UG', N'Ojwina', N'ojwina',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-LIRA-NBH-04')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-007', CountryCode = 'UG', Name = N'Central Division',
           NormalizedName = N'central division', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-LIRA-NBH-04';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-LIRA-NBH-04', N'UG-CITY-007', 'UG', N'Central Division', N'central division',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-SOROT-NBH-01')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-011', CountryCode = 'UG', Name = N'Pamba',
           NormalizedName = N'pamba', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-SOROT-NBH-01';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-SOROT-NBH-01', N'UG-CITY-011', 'UG', N'Pamba', N'pamba',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-SOROT-NBH-02')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-011', CountryCode = 'UG', Name = N'Moroto Road',
           NormalizedName = N'moroto road', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-SOROT-NBH-02';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-SOROT-NBH-02', N'UG-CITY-011', 'UG', N'Moroto Road', N'moroto road',
            'NEIGHBOURHOOD', 4, NULL, NULL);

IF EXISTS (SELECT 1 FROM dbo.Locations WHERE LocationCode = N'UG-SOROT-NBH-03')
    UPDATE dbo.Locations
       SET ParentLocationCode = N'UG-CITY-011', CountryCode = 'UG', Name = N'Eastern Division',
           NormalizedName = N'eastern division', LocationType = 'NEIGHBOURHOOD',
           AdminLevel = 4, Aliases = NULL, Notes = NULL
     WHERE LocationCode = N'UG-SOROT-NBH-03';
ELSE
    INSERT dbo.Locations (LocationCode, ParentLocationCode, CountryCode, Name, NormalizedName,
                          LocationType, AdminLevel, Aliases, Notes)
    VALUES (N'UG-SOROT-NBH-03', N'UG-CITY-011', 'UG', N'Eastern Division', N'eastern division',
            'NEIGHBOURHOOD', 4, NULL, NULL);


-- Example: search Uganda locations by name or alias.
SELECT l.LocationCode, l.Name, l.LocationType, p.Name AS ParentName, l.CountryCode
FROM dbo.Locations l
LEFT JOIN dbo.Locations p ON p.LocationCode = l.ParentLocationCode
WHERE l.CountryCode = 'UG'
  AND (l.Name LIKE N'%Kira%' OR l.Aliases LIKE N'%Kira%')
ORDER BY l.AdminLevel, l.Name;
